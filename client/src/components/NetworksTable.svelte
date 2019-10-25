<script>
  import Loader from "./Loader.svelte";
  import Modal from "./Modal.svelte";
  import { onMount } from "svelte";
  import { closestNetworks } from "../api/requests.js"

  let networks = [];
  let loading = true;
  let selected = {};
  let showModal = false;

  onMount(async () => {
    const fetchedNetworks = await closestNetworks()
    networks = fetchedNetworks;
    loading = false;
  });

  const getInfo = network => {
    selected = network;
    showModal === false ? (showModal = true) : (showModal = false);
  };

  const closeModal = () =>
    showModal === false ? (showModal = true) : (showModal = false);
</script>

<style>
  table {
    font-family: arial, sans-serif;
    /* Keeping this for later if border is needed */
    /* border-collapse: collapse; */
    background-color: rgb(53, 53, 53);
    width: 100%;
    border: 1px solid rgb(102, 102, 102);
    border-radius: 10px;
  }
  td,
  th {
    color: white;
    text-align: center;
    padding: 8px;
    width: 25%;
  }
  td {
    padding: 10px;
  }
  .table-row {
    cursor: pointer;
  }
  .table-row:hover {
    color: white;
    background-color: rgb(63, 63, 63);
  }
  .landing-loader {
    margin: 15% auto;
  }
</style>

<Modal {selected} show={showModal} {closeModal} />

{#if loading}
  <div class="landing-loader">
    <Loader />
  </div>
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
