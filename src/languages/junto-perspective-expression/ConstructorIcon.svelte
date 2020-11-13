<svelte:options tag={null}/>

<script lang="ts">
    export let commitExpression

    let perspectiveData = {
        name: "",
        about: "",
        members: []
    };
</script>

<div class="container">
    <input bind:value={perspectiveData.name}>
    <input bind:value={perspectiveData.about}>
    <button on:click={()=>commitExpression(perspectiveData)}>Commit</button>
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