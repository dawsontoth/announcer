curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - &&\
sudo apt-get install -y nodejs

which node
# /usr/bin/node
sudo crontab -e
@reboot (cd /home/trinity/announcer/ && /usr/bin/node index.js) &
