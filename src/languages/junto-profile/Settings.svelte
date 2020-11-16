<svelte:options tag={null}/>

<script lang="ts">
    import Icon from "./Icon.svelte";
    import {
        CognitoUserPool,
        CognitoUserAttribute,
        CognitoUser,
        AuthenticationDetails
    } from 'amazon-cognito-identity-js';

    let poolData = {
        UserPoolId: 'us-east-2_XshZxLWso', // Your user pool id here
        ClientId: '35caon8bjbsghlqdnth1cu45f2', // Your client id here
    };
    let userpool = new CognitoUserPool(poolData);
    export let settings: object

    export let signIn = function signIn(username: string, password: string) {
        var authenticationData = {
            Username: username,
            Password: password,
        };
        var authenticationDetails = new AuthenticationDetails(
            authenticationData
        );
        var userData = {
            Username: username,
            Pool: userpool,
        };
        var cognitoUser = new CognitoUser(userData);

        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function(result) {
                signInSuccess(result)
            },
         
            onFailure: function(err) {
                alert(err.message || JSON.stringify(err));
            },
        });
    }

    function signInSuccess(result) {
        console.log("Signin Success!", result.getAccessToken().getJwtToken(), "ID token:", result.getIdToken().getJwtToken())
        //@ts-ignore
        settings.cognitoSession = {
            accessToken: result.getAccessToken().getJwtToken(),
            idToken: result.getIdToken().getJwtToken(),
            refreshToken: result.getRefreshToken().getToken()
        };
    }

    let username = ""
    let password = ""
</script>

<div class="container">
    {#if settings }
        <input bind:value={username}>
        <input bind:value={password}>
        <button on:click={()=>signIn(username, password)}>Sign In</button>
        <br>
        {#if settings.cognitoSession != undefined}
            Signed In
        {:else}
            Signed Out
        {/if}

    {:else}
        Loading...
    {/if}
</div>
