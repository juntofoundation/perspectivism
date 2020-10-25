<svelte:options tag={null}/>

<script lang="ts">
    export let settings: object
    export let signIn

    let username = ""
    let password = ""
</script>

<div class="container">
    {#if settings }
        <input bind:value={username}>
        <input bind:value={password}>
        <button on:click={()=>signIn(username, password)}>Sign In</button>
    {:else}
        Loading...
    {/if}
</div>
