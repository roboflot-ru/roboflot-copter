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

Устанавливаем SD карту в бортовой компьютер и включаем его.
Находим в панели управления роутера IP адрес,
подключаемся к компьютеру по SSH (пользователь pi, пароль raspberry).

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

Тесты Navio 2

    sudo emlidtool test



### Ardupilot

Для первой настройки Ardupilot запускаем утилиту

    sudo emlidtool ardupilot

Выбираем arducopter, последнюю версию, включаем запуск при старте системы и сохраняем.
В файле настроек

    sudo nano /etc/default/arducopter

параметр телеметрии указываем как

	TELEM1="-A udp:127.0.0.1:14650"
	TELEM2="-A udp:127.0.0.1:14651"

    ARDUPILOT_OPTS="$TELEM1 $TELEM2"


14650 - порт для mavros
14651 - порт для mavproxy

Перегружаем компьютер и проверяем как работает Ardupilot

	sudo systemctl status arducopter


### MAVProxy

Ретрансляция в порт 5761 для сервиса remot3.it, в порт 5762 для локального подключения.

Пробуем как оно работает

	mavproxy.py --master=udp:127.0.0.1:14651 --out=tcpin:0.0.0.0:5761

Скрипт mavproxy.py используется как ретранслятор телеметрии с внутреннего порта на внешние.
Скрипт для автозапуска

    /scripts/mavproxy-start.sh

с таким содержимым

    #!/bin/bash

    mavproxy.py --master=udp:127.0.0.1:14651 --out=tcpin:0.0.0.0:5761  --out=tcpin:0.0.0.0:5762 --daemon

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
    ExecStart=/home/pi/copter/mavproxy_start.sh
    Restart=on-abort

    [Install]
    WantedBy=default.target


сохраняем и перегружаем системные сервисы

    sudo systemctl daemon-reload
    sudo systemctl enable mavproxy
    sudo systemctl start mavproxy

Проверяем как работает

	sudo systemctl status mavproxy

Теперь мы можем соединиться с бортом в локальной сети через GCS, используя IP-адрес борта и порт 5762



### remot3.it

Установка сервиса remot3.it на Raspbian https://remot3it.zendesk.com/hc/en-us/articles/115006015367-Installing-the-remot3-it-weavedconnectd-daemon-on-your-Raspberry-Pi.
Настраиваем порты:

    22 - SSH
    5761 - MAVProxy
    5000 - видео


Теперь дроном можно управлять из любого приложения (QGroundControl, APM Planner, Mission Planner, UgCS и других совместимых с протоколом MAVLink)
через интернет.





### ROS

Настройка из инструкции Navio https://docs.emlid.com/navio2/common/dev/ros/

    sudo echo "source /opt/ros/kinetic/setup.bash" >> ~/.bashrc
    sudo /opt/ros/kinetic/lib/mavros/install_geographiclib_datasets.sh

Запускаем QGroundControl на своем компьютере и соединеямся с портом 5762 по протоколу TCP, все должно работать

Для запуска при загрузке системы используем системный сервис systemd.
Создаем файл

    sudo nano /etc/systemd/system/roscore.service

с таким содержимым

    [Unit]
    Description=ROSCore Service
    After=arducopter.service

    [Service]
    Type=simple
    User=pi
    WorkingDirectory=/home/pi
    ExecStart=/home/pi/copter/scripts/roscore_start.sh
    Restart=on-abort

    [Install]
    WantedBy=default.target


сохраняем и перегружаем системные сервисы

    sudo systemctl daemon-reload
    sudo systemctl enable roscore
    sudo systemctl start roscore

Проверяем как работает

	sudo systemctl status roscore



Создаем файл

    sudo nano /etc/systemd/system/mavros.service

с таким содержимым

    [Unit]
    Description=MAVROS Service
    After=arducopter.service

    [Service]
    Type=simple
    User=pi
    WorkingDirectory=/home/pi
    ExecStart=/home/pi/copter/scripts/mavros_start.sh
    Restart=on-abort

    [Install]
    WantedBy=default.target


сохраняем и перегружаем системные сервисы

    sudo systemctl daemon-reload
    sudo systemctl enable mavros
    sudo systemctl start mavros

Проверяем как работает

	sudo systemctl status mavros



Создаем файл

    sudo nano /etc/systemd/system/robo.service

с таким содержимым

    [Unit]
    Description=ROBO Service
    After=arducopter.service

    [Service]
    Type=simple
    User=pi
    WorkingDirectory=/home/pi
    ExecStart=/home/pi/copter/scripts/main_start.sh
    Restart=on-abort

    [Install]
    WantedBy=default.target


сохраняем и перегружаем системные сервисы

    sudo systemctl daemon-reload
    sudo systemctl enable robo
    sudo systemctl start robo

Проверяем как работает

	sudo systemctl status robo




### Видеотрансляция

Настройка видеотрансляции с камеры Raspicam по UDP для локальной сети https://docs.emlid.com/navio2/common/dev/video-streaming/.
Настройка для TCP https://raspberrypi.stackexchange.com/questions/12156/is-it-possible-to-stream-h-264-with-rtsp-on-raspberry-pi.

Настраиваем на TCP порт, чтобы к нему мог подключаться сервис remot3.it.
Устанавливаем необходимые пакеты:

    sudo apt-get install gstreamer1.0-tools gstreamer1.0-plugins-good gstreamer1.0-plugins-bad
    sudo modprobe bcm2835-v4l2

Создаем файл для автозапуска

    sudo nano /etc/systemd/system/raspicam.service

с таким содержимым:

    [Unit]
    Description=raspivid
    After=network.target

    [Service]
    ExecStart=/bin/sh -c "modprobe bcm2835-v4l2 && gst-launch-1.0 -v v4l2src ! video/x-raw, width=320, height=240 ! timeoverlay text="T:" shaded-background=true ! jpegenc quality=20 ! multipartmux  boundary="--videoboundary" ! tcpserversink host=0.0.0.0 port=5001"

    [Install]
    WantedBy=default.target

Сохраняем файл (Ctrl+X, y), включаем и запускаем сервис:

    sudo systemctl daemon-reload
    sudo systemctl enable raspicam
    sudo systemctl restart raspicam

После выполнения команды должно открыться окошко с видеотрансляцией.



### NodeJS

Установка NodeJS https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions

    curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
    sudo apt-get install -y nodejs build-essential


### Менеджер процессов PM2

    sudo npm install pm2 -g


### Roboflot-copter

Клонируем этот репозиторий в папку copter и устанавливаем зависимости

    git clone https://github.com/roboflot-ru/roboflot-copter.git copter
    cd copter
    npm install


### Запукаем скрипт

    pm2 start main
    pm2 startup
    pm2 save








