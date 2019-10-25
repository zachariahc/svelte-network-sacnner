<script>
  import { onMount } from "svelte";
  export let headerMessage = String
  let data = [];

  onMount(async function() {
    const response = await fetch("http://localhost:3000/currentconnection");
    const json = await response.json();
    data = json;
    // console.log(data)
  });
</script>

<style>
  .current-data {
    color: rgb(231, 230, 230);
  }
  .header-container {
    display: flex;
    justify-content: space-around;
    width: 100%;
    background-color: rgb(60, 64, 88);
    border-radius: 10px;
    border: 1px solid rgb(102, 102, 102);
  }
  .header-text {
    color: rgb(231, 230, 230);
    text-align: center;
  }
</style>

<div class="header-container">
  {#each data as item}
    <p class="current-data">Current SSID: {item.ssid}</p>
    <p class="current-data">Current BSSID: {item.bssid}</p>
    <p class="current-data">Current Channel: {item.channel}</p>
    <p class="current-data">Signal Level: {item.signal_level}</p>
    <p class="current-data">Security: {item.security}</p>
  {/each}
</div>

<h2 class="header-text">{headerMessage}</h2>