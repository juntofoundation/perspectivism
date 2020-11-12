<svelte:options tag={null}/>

<script lang="ts">
    export let commitExpression

    let caption = "";
    let files

    export let commit = async function(caption) {
        if (files != undefined) {
            var file = files[0];
            let b64_file = await toBase64(file);
            let data = {
                size: file.size,
                img: b64_file,
                caption: caption
            };
            commitExpression(JSON.stringify(data));
        } else {
            //Show some error message
        }
    }

    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

</script>

<div class="container">
    <input bind:value={caption}>
    <input type="file"
       id="image_upload" name="image_upload"
       accept="image/png, image/jpeg"
       bind:files>
    <button on:click={()=>commit(caption)}>Commit</button>
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