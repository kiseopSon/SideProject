@echo off
REM JAVA_HOME이 비어 있으면 JDK 17 사용 (경로가 다르면 아래 한 줄만 수정)
if "%JAVA_HOME%"=="" set "JAVA_HOME=C:\Program Files\Java\jdk-17"
REM Maven/컴파일이 JDK 17을 쓰도록 PATH 맨 앞에 넣기
set "PATH=%JAVA_HOME%\bin;%PATH%"
call "%~dp0mvnw.cmd" spring-boot:run
