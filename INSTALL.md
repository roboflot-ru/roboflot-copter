
# Установка и настройка ПО для дрона

## Железо

В качестве бортового компьютера используется Raspberry Pi 3 B+.
На него устанавливается модуль Navio 2 с набором датчиков и периферией для управления дроном.
Репозиторий с исходниками Emlid Github https://github.com/emlid.


## ПО

Компьютер работает на Linux образе Raspbian Stretch.
Управление дроном и автопилот Arducopter 3.5.
Разные функции для автономного полета ROS.

Весь набор сразу в готовом образе для Navio 2 https://docs.emlid.com/navio2/common/ardupilot/configuring-raspberry-pi/.


## Установка ПО

### Установка образа на карту и обновление дистрибутива

Установка образа на SD карту
Скачиваем образ системы Raspbian Stretch отсюда (https://docs.emlid.com/navio2/common/ardupilot/configuring-raspberry-pi/).
Инструкция по установке там же. Записываем образ на SD карту с помощью Etcher или аналога.


После записи открываем в разделе BOOT файл

    /boot/wpa_supplicant.conf

и добавляем туда имя сети и пароль к которой компьютер будет подключаться по умолчанию

    network={
      ssid="yourssid"
      psk="yourpasskey"
      key_mgmt=WPA-PSK
    }

Устанавливаем SD карту в бортовой компьютер, включаем, находим в панели управления роутера IP адрес, подключаемся к компьютеру по SSH (пользователь pi, пароль raspberry).

Расширяем файловую систему на весь объем карты:

    sudo raspi-config --expand-rootfs

Перегружаем, подключаемся снова и запускаем утилиту конфигурации

    sudo raspi-config

Устанавливаем:
локаль en-US-UTF8
Часовой пояс Europe/Moscow
Страна в настройках WiFi: Russia

Сохраняем настройки и перегружаем компьютер. Подключаемся снова и обновляем ПО

    sudo apt-get update && sudo apt-get upgrade


### Ardupilot

Для первой настройки Ardupilot запускаем утилиту

    sudo emlidtool ardupilot

Выбираем arducopter, последнюю версию, включаем запуск при старте системы и сохраняем.
В файле настроек

    sudo nano /etc/default/arducopter

параметр телеметрии указываем как

	TELEM1="-A tcp:127.0.0.1:5760"

Телеметрия отправляется в локальный порт 5760, потом с помощью MAVProxy транслируется в TCP порты 5761 и 5762.
Перегружаем компьютер и проверяем как работает Ardupilot

	sudo systemctl status arducopter


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


### ROS

Настройка из инструкции Navio https://docs.emlid.com/navio2/common/dev/ros/

    sudo echo "source /opt/ros/kinetic/setup.bash" >> ~/.bashrc
    sudo /opt/ros/kinetic/lib/mavros/install_geographiclib_datasets.sh

Запускаем QGroundControl на своем компьютере и соединеямся с портом 5762 по протоколу TCP, все должно работать


### Видеотрансляция

Настройка видеотрансляции с камеры Raspicam по UDP для локальной сети https://docs.emlid.com/navio2/common/dev/video-streaming/.
Настройка для TCP https://raspberrypi.stackexchange.com/questions/12156/is-it-possible-to-stream-h-264-with-rtsp-on-raspberry-pi.

Настраиваем на TCP порт, чтобы к нему мог подключаться сервис remot3.it.
Устанавливаем необходимые пакеты:

    sudo apt-get install gstreamer1.0-tools gstreamer1.0-plugins-good gstreamer1.0-plugins-bad

Создаем файл для автозапуска

    sudo nano /etc/systemd/system/raspicam.service

с таким содержимым:

    [Unit]
    Description=raspivid
    After=network.target

    [Service]
    ExecStart=/bin/sh -c "/usr/bin/raspivid -t 0 -w 640 -h 480 -fps 15 -hf -b 2000000 -o - | gst-launch-1.0 -v fdsrc ! h264parse ! rtph264pay config-interval=1 pt=96 ! gdppay ! tcpserversink host=0.0.0.0 port=5000"

    [Install]
    WantedBy=default.target

Сохраняем файл (Ctrl+X, y), включаем и запускаем сервис:

    sudo systemctl daemon-reload
    sudo systemctl enable raspicam
    sudo systemctl restart raspicam

Для проверки видео на компьютере оператора запускаем (установка пакетов в ссылках выше).

    gst-launch-1.0 -v tcpclientsrc host=RASPBERRY_IP port=5000 ! gdpdepay ! rtph264depay ! avdec_h264 ! videoconvert ! autovideosink sync=false

После выполнения команды должно открыться окошко с видеотрансляцией.


### remot3.it

Установка сервиса remot3.it на Raspbian https://remot3it.zendesk.com/hc/en-us/articles/115006015367-Installing-the-remot3-it-weavedconnectd-daemon-on-your-Raspberry-Pi.
Настраиваем порты:

    22 - SSH
    5761 - MAVProxy
    5000 - видео


На этом этапе дроном можно управлять из любого приложения (QGroundControl, APM Planner, Mission Planner, UgCS и других совместимых с протоколом MAVLink)



