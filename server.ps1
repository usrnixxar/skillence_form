# Skillence Academy - Local Web Server & Admissions Leads API
# Lightweight HTTP server using System.Net.HttpListener

$port = 8080
$baseDir = $PSScriptRoot

$listener = New-Object System.Net.HttpListener
$prefixes = @("http://localhost:$port/", "http://127.0.0.1:$port/")

foreach ($p in $prefixes) {
    try {
        $listener.Prefixes.Add($p)
    } catch {}
}

try {
    $listener.Start()
} catch {
    # If 8080 is busy, try port 8081
    $port = 8081
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$port/")
    $listener.Prefixes.Add("http://127.0.0.1:$port/")
    $listener.Start()
}

# Auto-generate or refresh production assets on server startup
try {
    $buildScript = Join-Path $baseDir "build.js"
    if (Test-Path $buildScript) {
        $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
        if ($nodeCmd) {
            Start-Process -FilePath "node" -ArgumentList "`"$buildScript`"" -NoNewWindow -Wait
        }
    } else {
        $manifestScript = Join-Path $baseDir "generate-manifest.js"
        if (Test-Path $manifestScript) {
            $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
            if ($nodeCmd) {
                Start-Process -FilePath "node" -ArgumentList "`"$manifestScript`"" -NoNewWindow -Wait
            }
        }
    }
} catch {}

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " Skillence Academy Local Server is ACTIVE & RUNNING!   " -ForegroundColor Green
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host " Website URL: http://localhost:$port/" -ForegroundColor Yellow
Write-Host " Alternative: http://127.0.0.1:$port/" -ForegroundColor Yellow
Write-Host " Leads API:   http://localhost:$port/api/leads" -ForegroundColor Magenta
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " Press Ctrl+C in this terminal window to stop server.`n"

# Content-Type Mapping
$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".webp" = "image/webp"
    ".ico"  = "image/x-icon"
    ".mp4"  = "video/mp4"
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        try {
            $request = $context.Request
            $response = $context.Response

            # Global CORS
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            $response.AddHeader("Access-Control-Allow-Headers", "Content-Type, Accept")

            if ($request.HttpMethod -eq "OPTIONS") {
                $response.StatusCode = 204
                $response.Close()
                continue
            }

            $rawPath = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath)
            if ($rawPath -eq "/" -or $rawPath -eq "") {
                $rawPath = "/index.html"
            }

            # ==========================================
            # BACKEND ENDPOINT: POST /api/leads
            # ==========================================
            if ($rawPath -eq "/api/leads") {
                $response.ContentType = "application/json; charset=utf-8"

                if ($request.HttpMethod -ne "POST") {
                    $response.StatusCode = 405
                    $errBytes = [System.Text.Encoding]::UTF8.GetBytes('{"success":false,"error":"Method not allowed"}')
                    $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
                    $response.Close()
                    continue
                }

                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $bodyStr = $reader.ReadToEnd()

                $leadsFile = Join-Path $baseDir "leads.json"
                $leadsList = @()
                if (Test-Path $leadsFile) {
                    try {
                        $rawJson = Get-Content $leadsFile -Raw -Encoding UTF8
                        if ($rawJson -and $rawJson.Trim()) {
                            $parsed = $rawJson | ConvertFrom-Json
                            if ($parsed -is [System.Collections.IEnumerable]) {
                                $leadsList = @($parsed)
                            } else {
                                $leadsList = @($parsed)
                            }
                        }
                    } catch {}
                }

                try {
                    $newLead = $bodyStr | ConvertFrom-Json

                    # Backend validation: Exactly 10-digit mobile number
                    $phoneStr = ""
                    if ($null -ne $newLead.phone) {
                        $phoneStr = [string]$newLead.phone
                    }
                    $phoneStr = $phoneStr.Trim()

                    if (-not ($phoneStr -match '^[0-9]{10}$')) {
                        $response.StatusCode = 400
                        $errBytes = [System.Text.Encoding]::UTF8.GetBytes('{"success":false,"error":"Please enter a valid 10-digit mobile number."}')
                        $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
                        $response.Close()
                        continue
                    }

                    # Preserve phone number as string
                    $newLead.phone = $phoneStr
                    $newLead | Add-Member -NotePropertyName "receivedAt" -NotePropertyValue (Get-Date -Format "yyyy-MM-dd HH:mm:ss") -Force
                    $leadsList += $newLead

                    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
                    [System.IO.File]::WriteAllText($leadsFile, ($leadsList | ConvertTo-Json -Depth 5), $utf8NoBom)
                    Write-Host "[LEAD RECORDED] $($newLead.name) - $($newLead.course) ($($newLead.phone))" -ForegroundColor Green

                    $response.StatusCode = 200
                    $okBytes = [System.Text.Encoding]::UTF8.GetBytes('{"success":true,"message":"Lead saved successfully"}')
                    $response.OutputStream.Write($okBytes, 0, $okBytes.Length)
                } catch {
                    $response.StatusCode = 400
                    $failBytes = [System.Text.Encoding]::UTF8.GetBytes('{"success":false,"error":"Invalid JSON payload"}')
                    $response.OutputStream.Write($failBytes, 0, $failBytes.Length)
                }

                $response.Close()
                continue
            }

            # ==========================================
            # SECURITY FILTER: BLOCK SOURCE MAPS & PRIVATE BACKEND FILES
            # ==========================================
            $lowerPath = $rawPath.ToLower()
            $fileName = [System.IO.Path]::GetFileName($rawPath).ToLower()
            $reqExt = [System.IO.Path]::GetExtension($rawPath).ToLower()

            # Disable publicly served production source maps
            if ($reqExt -eq ".map" -or $lowerPath.EndsWith(".map")) {
                $response.StatusCode = 404
                $response.ContentType = "text/plain; charset=utf-8"
                $errBytes = [System.Text.Encoding]::UTF8.GetBytes("Source maps are disabled.")
                $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
                $response.Close()
                continue
            }

            # Ensure secret keys, credentials, and private server logic are kept on the backend
            $blockedFiles = @(
                "leads.json",
                "server.ps1",
                "start-server.bat",
                "generate-manifest.js",
                "build.js",
                "package.json",
                "package-lock.json",
                "test_complete_suite.js",
                "test_verify.js"
            )
            if ($blockedFiles -contains $fileName -or $lowerPath.StartsWith("/.git") -or $lowerPath.StartsWith("/src/")) {
                $response.StatusCode = 403
                $response.ContentType = "text/plain; charset=utf-8"
                $errBytes = [System.Text.Encoding]::UTF8.GetBytes("Access denied.")
                $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
                $response.Close()
                continue
            }

            # ==========================================
            # STATIC FILES SERVING (WITH HTTP RANGE FOR SMOOTH VIDEO PLAYBACK)
            # ==========================================
            $filePath = Join-Path $baseDir ($rawPath.TrimStart("/").Replace("/", "\"))
            
            if (Test-Path $filePath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                if ($mimeTypes.ContainsKey($ext)) {
                    $response.ContentType = $mimeTypes[$ext]
                } else {
                    $response.ContentType = "application/octet-stream"
                }

                $fileInfo = New-Object System.IO.FileInfo($filePath)
                $fileLength = $fileInfo.Length
                $rangeHeader = $request.Headers["Range"]

                $response.AddHeader("Accept-Ranges", "bytes")

                if ($rangeHeader -and $rangeHeader.StartsWith("bytes=")) {
                    $rangeSpec = $rangeHeader.Substring(6).Split("-")
                    $start = 0L
                    $end = $fileLength - 1L

                    if ($rangeSpec[0] -and $rangeSpec[0].Trim()) {
                        [Int64]::TryParse($rangeSpec[0], [ref]$start) | Out-Null
                    }
                    if ($rangeSpec.Length -gt 1 -and $rangeSpec[1] -and $rangeSpec[1].Trim()) {
                        [Int64]::TryParse($rangeSpec[1], [ref]$end) | Out-Null
                    }

                    if ($end -ge $fileLength) { $end = $fileLength - 1L }
                    $contentLength = $end - $start + 1L

                    $response.StatusCode = 206
                    $response.AddHeader("Content-Range", "bytes $start-$end/$fileLength")
                    $response.ContentLength64 = $contentLength

                    $fs = [System.IO.File]::OpenRead($filePath)
                    try {
                        $fs.Seek($start, [System.IO.SeekOrigin]::Begin) | Out-Null
                        $buffer = New-Object byte[] 65536
                        $bytesRemaining = $contentLength
                        while ($bytesRemaining -gt 0) {
                            $toRead = [Math]::Min($buffer.Length, $bytesRemaining)
                            $read = $fs.Read($buffer, 0, $toRead)
                            if ($read -le 0) { break }
                            $response.OutputStream.Write($buffer, 0, $read)
                            $bytesRemaining -= $read
                        }
                    } finally {
                        $fs.Close()
                    }
                } else {
                    $response.StatusCode = 200
                    $response.ContentLength64 = $fileLength
                    $fs = [System.IO.File]::OpenRead($filePath)
                    try {
                        $fs.CopyTo($response.OutputStream)
                    } finally {
                        $fs.Close()
                    }
                }
            } else {
                $response.StatusCode = 404
                $response.ContentType = "text/html; charset=utf-8"
                $notFoundBytes = [System.Text.Encoding]::UTF8.GetBytes("<h1>404 Not Found</h1><p>The requested file $rawPath does not exist.</p>")
                $response.OutputStream.Write($notFoundBytes, 0, $notFoundBytes.Length)
            }

            $response.Close()
        } catch {
            Write-Host "Request error: $_" -ForegroundColor DarkRed
            try { $context.Response.Close() } catch {}
        }
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
