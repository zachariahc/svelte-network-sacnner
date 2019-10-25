<style>
  table {
    font-family: arial, sans-serif;
    border-collapse: collapse;
    width: 100%;
  }

  td,
  th {
    border: 1px solid #dddddd;
    text-align: left;
    padding: 8px;
  }

  tr:nth-child(even) {
    background-color: #dddddd;
  }
.table-row {
  cursor: pointer;
}
.table-row:hover {
  opacity: .75;
}
</style>

<script>
  import Loader from "./Loader.svelte";
  import Modal from "./Modal.svelte";
  import { onMount } from "svelte";

  let networks = [];
  let loading = true;
  let selected = {}

  onMount(async function() {

    const response = await fetch("http://localhost:3000/networkscanone");
    const json = await response.json();
    networks = json;
    loading = false
    // console.log(data)
  });
const getInfo = (network) => selected = network

</script>

<Modal selected={selected} />

{#if loading}
<Loader />
{/if}

{#if !loading}
<table>
  <thead>
    <tr>
      <th>SSID</th>
      <th>BSSID</th>
      <th>Channel</th>
      <th>Security</th>
    </tr>
  </thead>

  <tbody>
  {#each networks as network}
    <tr class="table-row" on:click={e => getInfo(network)}>
      <td>{network.ssid}</td>
      <td>{network.bssid}</td>
      <td>{network.channel}</td>
      <td>{network.security}</td>
    </tr>
  {/each}
  </tbody>
</table>
{/if}
