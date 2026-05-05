@echo off
echo Abriendo puertos para Expo...
netsh advfirewall firewall add rule name="Expo Metro 8081" dir=in action=allow protocol=TCP localport=8081
netsh advfirewall firewall add rule name="Expo Metro 8082" dir=in action=allow protocol=TCP localport=8082
netsh advfirewall firewall add rule name="Expo Metro 8083" dir=in action=allow protocol=TCP localport=8083
echo Puertos abiertos correctamente!
pause
