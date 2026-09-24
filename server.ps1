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
                    $newLead | Add-Member -NotePropertyName "receivedAt" -NotePropertyValue (Get-Date -Format "yyyy-MM-dd HH:mm:ss") -Force
                    $leadsList += $newLead

                    $leadsList | ConvertTo-Json -Depth 5 | Set-Content $leadsFile -Encoding UTF8
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
            # STATIC FILES SERVING
            # ==========================================
            $filePath = Join-Path $baseDir ($rawPath.TrimStart("/").Replace("/", "\"))
            
            if (Test-Path $filePath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                if ($mimeTypes.ContainsKey($ext)) {
                    $response.ContentType = $mimeTypes[$ext]
                } else {
                    $response.ContentType = "application/octet-stream"
                }

                $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentLength64 = $fileBytes.Length
                $response.StatusCode = 200
                $response.OutputStream.Write($fileBytes, 0, $fileBytes.Length)
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
