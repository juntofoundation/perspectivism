<svelte:options tag={null}/>

<script lang="ts">
    import {
        CognitoUserPool,
        CognitoUserAttribute,
        CognitoUser,
        AuthenticationDetails
    } from 'amazon-cognito-identity-js';

    export let commitExpression;
    export let registering = true;
    export let confirming = false;

    export let authcode = '';

    let userData = {
        email: "",
        name: "",
        bio: "",
        username: "",
        gender: [],
        location: [],
        website: [],
        cognitoToken: undefined,
        password: ""
    };

    let poolData = {
        UserPoolId: 'us-east-2_XshZxLWso', // Your user pool id here
        ClientId: '35caon8bjbsghlqdnth1cu45f2', // Your client id here
    };
    let userPool = new CognitoUserPool(poolData);

    export let createUser= async function (userData) {
        userPool.signUp(userData.username, userData.password, [], null, function(
            err,
            result
        ) {
            if (err) {
                alert(err.message || JSON.stringify(err));
                return;
            }
            registering = false;
            confirming = true;
            var cognitoUser = result.user;
            console.log('user name is ' + cognitoUser.getUsername());
        });
    }

    export let confirmAndCommit = async function (authCode) {
        var cognitoUser = new CognitoUser({
            Username: userData.username,
            Pool: userPool
        });
        cognitoUser.confirmRegistration(authcode, true, function(err, result) {
            if (err) {
                alert(err.message || JSON.stringify(err));
                return;
            }
            console.log('call result: ' + result);
        });

        let authDetails = new AuthenticationDetails({
            Username : userData.username, // your username here
            Password : userData.password, // your password here
        })
        cognitoUser.authenticateUser(authDetails, {
            onSuccess: function (result) {
                console.log("Signin Success!", result.getAccessToken().getJwtToken(), "ID token:", result.getIdToken().getJwtToken())
                //@ts-ignore
                settings.cognitoSession = {
                    accessToken: result.getAccessToken().getJwtToken(),
                    idToken: result.getIdToken().getJwtToken(),
                    refreshToken: result.getRefreshToken().getToken()
                };
                userData.cognitoToken = result.getIdToken().getJwtToken();
            },

            onFailure: function(err) {
                alert(err);
            },
            mfaRequired: function(codeDeliveryDetails) {
                var verificationCode = prompt('Please input verification code' ,'');
                cognitoUser.sendMFACode(verificationCode, this);
            }
        });
        commitExpression(userData)
    }
</script>

<div class="container">
{#if registering && registering == true}
    <input bind:value={userData.email}>
    <input bind:value={userData.name}>
    <input bind:value={userData.bio}>
    <input bind:value={userData.username}>
    <input bind:value={userData.password}>
    <input bind:value={userData.gender}>
    <input bind:value={userData.location}>
    <input bind:value={userData.website}>
    <button on:click={()=>createUser(userData)}>Register</button>
{:else if confirming && confirming == true}
    <input bind:value={authcode}>
    <button on:click={()=>confirmAndCommit(userData)}>Confirm</button>
{/if}
</div>


<style>
    .container {
        color: burlywood;
        width: 400px;
        height: 300px;
    }

    input {
        width: 100%;
        height: 200px;
    }
</style>