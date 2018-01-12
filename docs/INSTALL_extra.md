



	TELEM1="-A tcp:127.0.0.1:5760" udp:127.0.0.1:14550

Телеметрия отправляется в локальный порт 5760, потом с помощью MAVProxy транслируется в TCP порты 5761 и 5762.
Перегружаем компьютер и проверяем как работает Ardupilot



### MAVProxy

Ретрансляция в порт 5761 для сервиса remot3.it, в порт 5762 для локального подключения.

Пробуем как оно работает

	mavproxy.py --master=tcp:127.0.0.1:5760 --out=tcpin:0.0.0.0:5761

Скрипт mavproxy.py используется как ретранслятор телеметрии с внутреннего порта на внешние.
Создаем скрипт для автозапуска

    nano /home/pi/copter/mavproxy-start.sh

с таким содержимым

    #!/bin/bash

    mavproxy.py --master=tcp:127.0.0.1:5760 --out=tcpin:0.0.0.0:5761  --out=tcpin:0.0.0.0:5762 --daemon

Сохраняем и добавляем ему прав на исполнение:

    sudo chmod +x mavproxy-start.sh

Для запуска при загрузке системы используем системный сервис systemd.
Создаем файл

    sudo nano /etc/systemd/system/mavproxy.service

с таким содержимым

    [Unit]
    Description=MAVProxy Service
    After=arducopter.service

    [Service]
    Type=simple
    User=pi
    WorkingDirectory=/home/pi
    ExecStart=/home/pi/copter/mavproxy-start.sh
    Restart=on-abort

    [Install]
    WantedBy=default.target


сохраняем и перегружаем системные сервисы

    sudo systemctl daemon-reload
    sudo systemctl enable mavproxy
    sudo systemctl start mavproxy

Проверяем как работает

	sudo systemctl status mavproxy

Если есть ошибки, то перегружаем компьютер и проверяем еще раз.



### remot3.it

Установка сервиса remot3.it на Raspbian https://remot3it.zendesk.com/hc/en-us/articles/115006015367-Installing-the-remot3-it-weavedconnectd-daemon-on-your-Raspberry-Pi.
Настраиваем порты:

    22 - SSH
    5761 - MAVProxy
    5000 - видео


На этом этапе дроном можно управлять из любого приложения (QGroundControl, APM Planner, Mission Planner, UgCS и других совместимых с протоколом MAVLink)



Для проверки видео на компьютере оператора запускаем (установка пакетов в ссылках выше).

    gst-launch-1.0 -v tcpclientsrc host=RASPBERRY_IP port=5000 ! gdpdepay ! rtph264depay ! avdec_h264 ! videoconvert ! autovideosink sync=false
