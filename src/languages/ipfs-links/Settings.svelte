<svelte:options tag={null}/>

<script lang="ts">
    export let settings: object

    $: if(settings && !settings.roomName) {
        settings.roomName = 'acai-ipfs-links-default-room'
    }

    

</script>

<div class="container" on:click:stopPropagation>
    {#if settings }
        <table>
            <tr>
                <td>PubSub room:</td>
                <td><input bind:value={settings.roomName}></td>
            </tr>
        </table>
    {:else}
        Loading...
    {/if}
</div>
