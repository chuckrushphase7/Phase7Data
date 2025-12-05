param(
  [string]$Phase7Data = "C:\GitRepos\Phase7Data",
  [string]$Tag = "v1.0.0"
)

$dt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
$out = @"
const apkInfo = {
  buildDate: "$dt",
  tag: "$Tag"
};
"@

Set-Content -Encoding UTF8 -Path (Join-Path $Phase7Data "apk_info.js") -Value $out
Write-Host "Wrote: $(Join-Path $Phase7Data 'apk_info.js')"
