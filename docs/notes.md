# Some notes

## Back up your SD card image

Copy gziped image to your drive

    diskutil list
    sudo dd if=/dev/rdisk1 bs=1m | gzip > ~/Desktop/pi.gz

Restore from backup

    diskutil unmountDisk /dev/disk1
    gzip -dc ~/Desktop/pi.gz | sudo dd of=/dev/rdisk1 bs=1m


https://smittytone.wordpress.com/2013/09/06/back-up-a-raspberry-pi-sd-card-using-a-mac/


Copy SD image to card with different size
https://stackoverflow.com/questions/19355036/how-to-create-an-img-image-of-a-disc-sd-card-without-including-free-space


