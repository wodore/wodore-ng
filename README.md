#WODORE front-end
Based on [GAE angular material starter][].

#GAE Angular Material Starter
######You can see live demo here: https://gae-angular-material-starter.appspot.com/

##What do I need?
First make sure you've got following things installed on your machine:
* [Google App Engine SDK for Python][]
* [Node.js][]
* [pip][]
* [virtualenv][]

##Install!
Using yeoman:
```
sudo npm install -g generator-gae-angular-material-starter
mkdir myNewApp && cd myNewApp
yo gae-angular-material-starter  # it will ask you few questions, e.g your app name, etc.
gulp run
```

Using github:
```
git clone https://github.com/madvas/gae-angular-material-starter
cd gae-angular-material-starter
npm install
gulp run
```
And that's it! You should now see the app running on port 8080.
You can now sign in via Google, or you can click "Generate Database" and then sign in as "admin" with password "123456"

##Deploy!
When you're done with your beautiful Material Design app it's time to deploy!
First, make sure you change your application name in `app.yaml`
```
gulp build
appcfg.py update main
```
And that's it! Your next big thing is out!


[google app engine sdk for python]: https://developers.google.com/appengine/downloads
[node.js]: http://nodejs.org/
[pip]: http://www.pip-installer.org/
[virtualenv]: http://www.virtualenv.org/
[gae-init]: https://github.com/gae-init/gae-init
[meanjs]: https://github.com/meanjs/mean
[GAE angular material starter]: https://github.com/madvas/gae-angular-material-starter
