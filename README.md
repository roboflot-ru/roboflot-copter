# Удаленное управление БПЛА для Roboflot Aero

Бортовой скрипт для трансляции телеметрии и видео в панель управления БПЛА Roboflot Aero.
Описание установки и настройки https://roboflot.gitbook.io/aero/avtonomnye-bpla/ustanovka-i-nastroika-navio-2-i-raspberry-pi-3
Описание системы управления https://www.roboflot.ru/aerophoto-system-roboflot-aero


## Установка

    git clone https://github.com/roboflot-ru/roboflot-copter.git copter
    cd copter
    npm install


## Настройка

Для настройки необходимы API-ключи для телеметрии и видеотрансляции, которые можно скопировать в панели управления Roboflot Pilot.

    nano copter.js

Запишите ключи из панели управления в следующие переменные (вместо abcd1234)

    const MAVPROXY_KEY = 'abcd1234';
    const VIDEO_KEY = 'abcd1234';

Пробный запуск

    node copter


