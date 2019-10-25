<style>
.modal-container {
    width: 400px;
    height: 300px;
    background-color: white;
    margin: 0 auto;
    display: flex;
    justify-content: center;
}
</style>

<script>
  import { onMount } from "svelte";
  export let selected = {}
    console.log(selected)
  onMount (() => {
      console.log(selected)
  })

</script>

<div class="modal-container">

<div>
<p>SSID: {selected.ssid}</p>
<br>
<p>BSSID: {selected.bssid}</p>
<br>
<p>Channel: {selected.channel}</p>
<br>
<p>Security: {selected.security}</p>
</div>

</div>