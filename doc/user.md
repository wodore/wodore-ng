Authentitation
--------------
There is a angular service called `gaAuthenticatedUser` defined in */main/public/modules/core/services/gaAuthentication.client.service.js* which saves a user.
The user needs to be logged in, otherwise it is set to **false**.
The user, saved in *gaAuthenicatedUser* is set in *main/templates/base.html*.
*base.html* is an **jinja** template used by Flask and the following line sets the user:
`module.value('gaAuthenticatedUser', {{ user | tojson | safe }});`
The variable `user` is defined by Python in */main/control/index.py* by the `inject_user()` function.


