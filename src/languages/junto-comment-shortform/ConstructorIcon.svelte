<svelte:options tag={null}/>

<script lang="ts">
    export let commitExpression

    let body = ""

</script>

<div class="container">
    <input bind:value={body}>
    <button on:click={()=>commitExpression(body)}>Commit</button>
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