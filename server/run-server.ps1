$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:ASPNETCORE_URLS = "http://localhost:5000"
Set-Location "D:\Jam Project\PersonalKnowledgeBase\server\PersonalKnowledgeBase.Api"
Start-Process -FilePath "dotnet" `
    -ArgumentList "run --no-build" `
    -RedirectStandardOutput "D:\Jam Project\PersonalKnowledgeBase\server\PersonalKnowledgeBase.Api\Logs\stdout.log" `
    -RedirectStandardError "D:\Jam Project\PersonalKnowledgeBase\server\PersonalKnowledgeBase.Api\Logs\stderr.log" `
    -PassThru -NoNewWindow
