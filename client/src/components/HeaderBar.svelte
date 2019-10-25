<style>
.hello-header {
    color: white;
    /* margin: 0 auto; */
}
.header-container {
    display: flex;
    justify-content: space-around;
    width: 100%;
    background-color: rgb(57, 91, 104);
    border-radius: 10px;
    border: 1px solid rgb(230, 230, 230);
}
</style>

<script>
  import { onMount } from "svelte";
  let data = [];

  onMount(async function() {

    const response = await fetch("http://localhost:3000/currentconnection");
    const json = await response.json();
    data = json;
    // console.log(data)
  });
  </script>


<div class="header-container">
{#each data as item }
    <p class="hello-header">Current SSID: {item.ssid}</p>
    <p class="hello-header">Current BSSID: {item.bssid}</p>
    <p class="hello-header">Current Channel: {item.channel}</p>
    <p class="hello-header">Signal Level: {item.signal_level}</p>
    <p class="hello-header">Security: {item.security}</p>
{/each}
</div>