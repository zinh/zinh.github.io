---
layout: post
title: "AWS Cognito: client and server authentication"
date: 2023-03-15 00:16:00
summary: Notes on how to setup AWS Cognito as authentication service for your web application
description: Notes on how to setup AWS Cognito as authentication service for your web application
categories: infrastructure
---

I have struggled for quite sometimes on setting up Cognito and how to put it in your web application as an authentication service.
As the documentation from AWS is not quite clear on setting up, this post is how I done it.

# The setup

# Client side

## 1. Create user pool

User pool is like your user's table. It will contain user's information such as email, username, password, etc.
So the first step with Cognito is to create a user pool.

AWS has a step-by-step guide on setting up a user pool at [Tutorial: create user pool](https://docs.aws.amazon.com/cognito/latest/developerguide/tutorial-create-user-pool.html)

## 2. Create an app client

An app client will specify how your app will authenticate with your user's pool. We can choose a client -> cogito authentication flow, client -> server -> cognito flow, or even a custom flow.

For more detail, refer to this guide: [Configuring a user pool app client](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-client-apps.html?icmpid=docs_cognito_console_help_panel)

In this post, I've choosen client -> cognito flow(no need to implement a server).

## 3. Create hosted UI

Hosted UI is AWS's provided login page, if we don't want to create a login page, we can use hosted UI.
We can make some simple modification to the look of hosted UI by provide our own css file. Here is what we can custom the hosted UI: [Customizing the built-in sign-in and sign-up webpages](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-app-ui-customization.html)

## 4. Client's code

### 4.1. Redirect to hosted UI

### 4.2. Callback endpoint

After user has successfully login, they will be redirected back to callback endpoint with `code` parameter.
We will use this code to exchange for access_token.

```js
var myHeaders = new Headers();
myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

var urlencoded = new URLSearchParams();
urlencoded.append("grant_type", "authorization_code");
urlencoded.append("client_id", process.env.AWS_COGNITO_APP_CLIENT_ID);
urlencoded.append("code", code);
urlencoded.append("redirect_uri", "https://localhost:1234/callback");

var requestOptions = { method: 'POST', headers: myHeaders, body: urlencoded, redirect: 'follow' };

const response = await fetch("https://sakura-vinh.auth.ap-northeast-1.amazoncognito.com/oauth2/token", requestOptions)
const body = await response.json();
```

# Server side

Now let's say we have an API server and we need to protect it using Cogito user's pool.
I'll use express and cognito-express package.

```js
const cognitoExpress = new CognitoExpress({
  region: "ap-northeast-1",
  cognitoUserPoolId: process.env.AWS_COGNITO_USERPOOL_ID,
  tokenUse: "access",
  tokenExpiration: 3_600_000
});
```

API with authentication

We'll add a middleware to extract access_token from Authorization header and check it against our user's pool on Cognito

```js
authenticatedRoute = express.Router();
app.use("/api", authenticatedRoute);
authenticatedRoute.use(function(req, res, next) {
  let accessTokenFromClient = extractToken(req.headers.authorization);
  if (!accessTokenFromClient) return res.status(401).send("Access Token missing from header");
  cognitoExpress.validate(accessTokenFromClient, function(err, response) {
    if (err) return res.status(401).send(err);
    res.locals.user = response;
    next();
  });
});

const extractToken = (authHeader) => {
  if (authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7, authHeader.length);
    return token;
  } else {
    throw Error("invalid header");
  }
}
```

after that we can put an API endpoint behind the middleware

```js
authenticatedRoute.get("/hello", function(_req, res, _next) {
  res.send(`Hi ${res.locals.user.username}, your API call is authenticated!`);
});
```

# Cognito's identity pool

One interesting thing to do with Cognito is we can let our user have a temporary access to AWS so that for example an authenticated user can call an Lambda on front-end.

To do this, we need to create an identity pool(also known as Federated Identities). With identity pool, we can use Cognito's user pool as a identity source or we can use other OAuth services such as Facebook, SAML, etc.

I'll just use my user pool as a identity source.

1. Create an identity pool
2. Create a role with approriate permission
3. Client code

From 4.2 above we can get access_token, id_token and refresh_token from Cognito. We will use this id_token to exchange for Identity ID using [GetID](https://docs.aws.amazon.com/cognitoidentity/latest/APIReference/API_GetId.html) command

```js
import { CognitoIdentityClient, GetIdCommand, GetCredentialsForIdentityCommand } from "@aws-sdk/client-cognito-identity";
const client = new CognitoIdentityClient({ region: process.env.AWS_DEFAULT_REGION });
const logins = {
  [`cognito-idp.ap-northeast-1.amazonaws.com/${process.env.AWS_COGNITO_USERPOOL_ID}`]: info.id_token
}
const getIdParams = {
  IdentityPoolId: process.env.AWS_COGNITO_IDENTITY_POOL_ID,
  Logins: logins
}
const command = new GetIdCommand(getIdParams);
const getIdResponse = await client.send(command);
```

Then using Identity ID to exchange for AWS's access_token by calling [GetCredentialsForIdentity](https://docs.aws.amazon.com/cognitoidentity/latest/APIReference/API_GetCredentialsForIdentity.html)

```js
const getCredsParams = {
  IdentityId: getIdResponse.IdentityId,
  Logins: logins
}
const credCommand = new GetCredentialsForIdentityCommand(getCredsParams);
const credsResp = await client.send(credCommand);
return credsResp.Credentials;
```

We can use this Credentials to call other AWS service, such as

```js
const getSTSInfo = async (credential) => {
  const { AccessKeyId, Expiration, SecretKey, SessionToken } = credential;
  const credentials = {
    accessKeyId: AccessKeyId,
    expiration: Expiration,
    secretAccessKey: SecretKey,
    sessionToken: SessionToken
  }
  const client = new STSClient({ credentials, region: process.env.AWS_DEFAULT_REGION });
  const command = new GetCallerIdentityCommand({});
  try {
    const response = await client.send(command);
    console.log(response);
  } catch (error) {
    console.log(error);
  }
}
```
