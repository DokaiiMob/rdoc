# Unregister .rdoc from HKCU
Remove-Item -Path "HKCU:\Software\Classes\.rdoc" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "HKCU:\Software\Classes\rdoc.Document" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "Unregistered .rdoc"
