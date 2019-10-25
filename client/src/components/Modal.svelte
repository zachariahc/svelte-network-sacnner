<script>
  import { onMount } from "svelte";
  // Props in modal component
  export let selected = Object;
  export let show = Boolean;
  export let closeModal = Function;
  let openOrClosed = "fa-eye-slash";
  let showPass = "password";
  const showPassword = () => {
    openOrClosed === "fa-eye-slash"
      ? (openOrClosed = "fa-eye")
      : (openOrClosed = "fa-eye-slash");
    showPass === "password" ? (showPass = "text") : (showPass = "password");
  };
  const connectToNetwork = () => {
    console.log('Attempting to connect')
  }
</script>

<style>
  /* The Modal (background) */
  .modal {
    position: fixed;
    z-index: 1;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgb(0, 0, 0);
    background-color: rgba(0, 0, 0, 0.4);
  }
  .modal-content {
    background-color: #fefefe;
    margin: 15% auto;
    padding: 20px;
    border: 1px solid #888;
    width: 500px;
  }
  .close {
    color: #aaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
  }
  .close:hover,
  .close:focus {
    color: black;
    text-decoration: none;
    cursor: pointer;
  }
  .connect-content {
    margin: 0 auto;
    width: 75%;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .input-container {
    display: -ms-flexbox;
    display: flex;
    width: 100%;
    margin-bottom: 15px;
  }
  .icon {
    padding: 10px;
    height: 20px;
    background: dodgerblue;
    color: white;
    min-width: 50px;
    text-align: center;
  }
  .input-field {
    width: 100%;
    padding: 10px;
    outline: none;
  }
  .input-field:focus {
    border: 2px solid dodgerblue;
  }
  .btn {
    background-color: dodgerblue;
    color: white;
    padding: 15px 20px;
    border: none;
    cursor: pointer;
    width: 100%;
    opacity: 0.9;
  }
  .btn:hover {
    opacity: 1;
  }
</style>

{#if show}
  <div id="myModal" class="modal">
    <div class="modal-content">
      <span class="close" on:click={closeModal}>&times;</span>
      <div class="connect-content">
        <h3>You are attempting to connect to:</h3>
        <h4>{selected.ssid}</h4>
        <p>Please enter a password and clck</p>
        <div class="input-container">
          <i class={`fas ${openOrClosed} icon`} on:click={showPassword} />
          <input
            class="input-field"
            type={showPass}
            placeholder="password"
            name="usrname" />
        </div>
        <button type="submit" class="btn" on:click={connectToNetwork}>Connect</button>
      </div>
    </div>
  </div>
{/if}
