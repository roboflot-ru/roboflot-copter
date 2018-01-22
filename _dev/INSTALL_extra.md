



	TELEM1="-A tcp:127.0.0.1:5760" udp:127.0.0.1:14550

Телеметрия отправляется в локальный порт 5760, потом с помощью MAVProxy транслируется в TCP порты 5761 и 5762.
Перегружаем компьютер и проверяем как работает Ardupilot










Для проверки видео на компьютере оператора запускаем (установка пакетов в ссылках выше).

    gst-launch-1.0 -v tcpclientsrc host=RASPBERRY_IP port=5000 ! gdpdepay ! rtph264depay ! avdec_h264 ! videoconvert ! autovideosink sync=false




Установка и настройка Vision Landing
Настройка PIXFlow

https://pixhawk.org/modules/px4flow

Управление всей картографической информацией сельскохозяйственного предприятия

Интеграции с внешними сервисами и отраслевыми системами 1С




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

