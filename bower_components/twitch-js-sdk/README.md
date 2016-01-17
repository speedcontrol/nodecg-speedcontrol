# Twitch JavaScript SDK

The Twitch JavaScript SDK provides rich functionality for accessing the Twitch API. This includes Twitch Connect, which allows users to bring their Twitch accounts into your application.

Check out the [Project page](http://justintv.github.com/twitch-js-sdk).

You might also be interested in the [annotated source code](http://justintv.github.com/twitch-js-sdk/docs/twitch.html).

For a detailed specification of API resources, see the [wiki](https://github.com/justintv/Twitch-API/wiki/API).

## Loading

To integrate the Twitch JavaScript SDK on your site, follow these steps:

First, register a [new client application][]. Record the **Client ID** and **Client Secret** you receive in a safe place.

To load and initialize the SDK, add the following code to your page, filling in the __Client ID__ of your app:

```html
<script src="//code.jquery.com/jquery.min.js"></script>
<script src="https://ttv-api.s3.amazonaws.com/twitch.min.js"></script>

<script>
  Twitch.init({clientId: 'YOUR_CLIENT_ID_HERE'}, function(error, status) {
    // the sdk is now loaded
  });
</script>
```

You can now perform actions that do not require authorization or have your users log in to Twitch for additional permissions.

[new client application]: http://www.twitch.tv/kraken/oauth2/clients/new

### Login

To add login functionality, first add the button to your page:

```html
<img src="http://ttv-api.s3.amazonaws.com/assets/connect_dark.png" class="twitch-connect" href="#" />
```

Now add the JavaScript to trigger the login:

```javascript
$('.twitch-connect').click(function() {
  Twitch.login({
    scope: ['user_read', 'channel_read']
  });
})
```

You probably only want to show the button when the user is not logged in, so add this to the callback on Twitch.init:

```javascript
if (status.authenticated) {
  // Already logged in, hide button
  $('.twitch-connect').hide()
}
```

#### Assets

You may use these assets for the Twitch Connect button:

![Connect Light](http://ttv-api.s3.amazonaws.com/assets/connect_light.png)

![Connect Dark](http://ttv-api.s3.amazonaws.com/assets/connect_dark.png)


## Integration Example

For an example of integrating the Twitch SDK with login functionality, please check out the [example implemention][].

![Authorize page][]

[example implemention]: http://justintv.github.com/twitch-js-sdk/example.html
[Authorize page]: http://ttv-api.s3.amazonaws.com/screenshots/authorize.png

## Core Methods

### Twitch.init

Initialize the Twitch API with your Client ID. This method must be called prior to other actions. If the user is already authenticated, you can perform authenticated actions after initialization. Otherwise, you must call Twitch.login to have the user authorize your app. 

#### Usage

```javascript
Twitch.init({clientId: 'YOUR_CLIENT_ID_HERE'}, function(error, status) {
  if (error) {
    // error encountered while loading
    console.log(error);
  }
  // the sdk is now loaded
  if (status.authenticated) {
    // user is currently logged in
  }
});
```

### Twitch.api

Make direct requests to the [Twitch API][] on behalf of your users. This method handles authorization, so any requests you make to the API will automatically be authenticated on behalf of the logged in user.

[Twitch API]: https://github.com/justintv/twitch-js-sdk/wiki/API

#### Usage

Get the logged-in user's channel stream key:

```javascript
Twitch.api({method: 'channel'}, function(error, channel) {
  console.log(channel.stream_key);
});
```

If the request you wish to make supports optional [parameters] to augment the amount or type of data received, you may add them to your call by adding a 'params' sub-hash:

```javascript
Twitch.api({method: 'streams', params: {game:'Diablo III', limit:3} }, function(error, list) {
  console.debug(list);
});
```
[parameters]: https://github.com/justintv/Twitch-API/blob/master/resources/streams.md#parameters

#### API PUT and DELETE example

Some API endpoints require different HTTP methods, you can achieve this using the verb parameter.

```javascript
Twitch.api({method: '/users/:user/follows/channels/:target', verb: 'PUT' }, function([...]) {
  [...]
});
```

## Authentication
The Twitch JavaScript SDK enables your users to log on or register using their Twitch accounts. The SDK handles synchronizing state between your site and Twitch, so users will stay logged in to your app as long as they have a valid access token.

### Twitch.login

Log in a user or request additional permissions. By default, the user will be directed to the Twitch sign in & approve page, then back to the same page. This page must be the `redirect_uri` you specified when creating the client. You may customize the `redirect_uri` if the user is currently on a different page. Make sure the JavaScript SDK is included on the `redirect_uri` page.

Once the user is returned to the `redirect_uri` after authorization, the SDK will store the session infomation in [DOM Storage][] or cookies, so authentication will persist throughout your website. You may also store this token, associated with a user on your site, to make continued requests on behalf of that user.

[DOM Storage]: https://developer.mozilla.org/en/DOM/Storage#sessionStorage

#### Usage

```javascript
Twitch.login({
  scope: ['user_read', 'channel_read']
});

TODO: args list, scopes, popups for advanced functionality
```

### Twitch.logout

Reset the session and delete from persistent storage, which is akin to logging out. This does not deactivate the access token given to your app, so you can continue to perform actions if your server stored the token.

#### Usage

```javascript
Twitch.logout(function(error) {
    // the user is now logged out
});
```

### Twitch.getStatus

Retrieve the current login status of a user. Whenever possible, `getStatus` will try to use the stored session for speed. You can force `getStatus` to check the stored session against the API if needed.

#### Usage

```javascript
Twitch.getStatus(function(err, status) {
  if (status.authenticated) {
    console.log('authenticated!');
  }
});
```

Force an update of the status:

```javascript
Twitch.getStatus({force: true}, function(err, status) {
  if (status.authenticated) {
    console.log('authenticated!')
  }
}
```

### Twitch.getToken

Retrieve the current OAuth token for a user, if one exists. This is useful for persisting an OAuth token to your backend.

#### Usage

```javascript
var token = Twitch.getToken()
alert(token)
```

## Events

Most JavaScript-heavy apps use events to be notified of state changes. Some changes might occur due to user actions outside your app's control, so the only way to be notified is through events.

`Twitch.events.addListener` allows you to subscribe to an event:

```javascript
Twitch.events.addListener('auth.login', function() {
  // user is logged in
});
```

`Twitch.events.removeListener` allows you to remove listeners for an event:

```javascript
var handleLogin = function() {
  alert("you're logged in!");
};

Twitch.events.addListener('auth.login', handleLogin);
Twitch.events.removeListener('auth.login', handleLogin);
```

`Twitch.events.removeAllListeners` allows you to remove all listeners for an event.

### auth.login

This event is emitted when we initialize a session for a user, either because the current page is a login `redirect_uri` or we have restored the session from persistent storage. 

### auth.logout

This event is emitted when we no longer have a valid session for a user. This means we either called `Twitch.logout` or the user has revoked access on Twitch for your application.

## Development

### Building

```bash
make
```

### Tests

```bash
make test
```

### Docs

Install pygments as described [here](https://github.com/mojombo/jekyll/wiki/install)

```bash
make docs
```

To update the docs on github pages:

```bash
git checkout gh-pages
make
```
