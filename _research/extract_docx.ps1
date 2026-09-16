Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.Web
$zip = [System.IO.Compression.ZipFile]::OpenRead('C:\Projects\Shantikalaniketan\Website Contents.docx')
$entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
$reader = New-Object System.IO.StreamReader($entry.Open())
$xml = $reader.ReadToEnd()
$reader.Close()
$zip.Dispose()
$text = $xml -replace '</w:p>', "`r`n"
$text = $text -replace '<[^>]+>', ''
$text = [System.Web.HttpUtility]::HtmlDecode($text)
$text | Out-File 'C:\Projects\Shantikalaniketan\_research\website_contents.txt' -Encoding UTF8
Write-Output 'ok'
