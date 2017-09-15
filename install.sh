#!/usr/bin/bash

#
#   work in progress ..
#

# - variable
pathConfig="$(pwd)"

# - mise à jour

sudo pacman --noconfirm -Syu

# - installation with pacman

sudo pacman -S --noconfirm \
                htop iftop vim zsh gufw whois nmap \
                nginx php-fpm python-pip ruby yarn \
                nodejs docker docker-compose powerline \
                notepadqq sqlmap jdk8-openjdk mariadb

sudo pip install thefuck django django-admin flask

# -- Configuration

# create group
sudo groupadd www-dev

# add group
sudo usermod -aG docker $USER
sudo usermod -aG www-dev $USER 

# grub & grub config
sudo rm -rf /etc/default/grub
sudo cp $pathConfig/config/grub /etc/default/

# -- injections de mes fichiers de configuration

# zshrc
sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"
sudo sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"
if (ls -alrt ~/. | grep .zshrc)
then 
    sudo rm -rf ~/.zshrc
    sudo rm -rf /root/.zshrc
fi
cp $pathConfig/config/zshrc ~/.zshrc
sudo cp $pathConfig/config/zshrc /root/.zshrc
chsh /usr/bin/zsh
sudo chsh /usr/bin/zsh

# nginx
# TODO: créer mes fichiers de configuration de nginx.
if (ls -alrt /etc/nginx | grep nginx.config)
then
    mkdir /etc/nginx/server
    rm -rf /etc/nginx/nginx.config
fi
cp $pathConfig/config/nginx /etc/nginx/nginx.config
sudo chown desk:www-dev /etc/php/php-fpm.d/www.conf
sudo systemctl enable nginx
sudo systemctl start nginx

# php-fpm 
# TODO: bien verifier que cela fonctionne.
# U
if (ls -alrt /etc/php/php-fpm.d | grep www.conf)
then
    rm -rf /etc/php/php-fpm.d/www.conf
fi
sudo cp $pathConfig/config/php-fpm /etc/php/php-fpm.d/www.conf
sudo chown desk:www-dev /etc/php/php-fpm.d/www.conf
sudo systemctl enable php-fpm
sudo systemctl start php-fpm

# rofi
if (ls -alrt ~/ | grep .Xresources)
then
    rm -rf ~/.Xresources
fi
cp $pathConfig/config/xresources ~/.Xresources
xrdb .Xresources

# gdm ~~ a venir ...
#mkdir /usr/share/gdm/themes/
#cp $pathConfig/config/themes/gdm/gdmtheme /usr/share/gdm/themes/

#vim
curl -sLf https://spacevim.org/install.sh | bash
sudo curl -sLf https://spacevim.org/install.sh | bash

# remove files install
rm -rf $pathConfig/../dotfiles
clear
echo installation effectué.
done