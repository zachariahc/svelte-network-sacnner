<script>
  import { onMount } from "svelte";
  import MiniLoader from "./MiniLoader.svelte";
  import { netConnect } from "../api/requests.js" 
  // Props in modal component
  export let selected = Object;
  export let show = Boolean;
  export let closeModal = Function;
  // Variables used to change classes and trigger actions
  let connecting = false;
  let openOrClosed = "fa-eye-slash";
  let showPass = "password";
  let active = "btn-deactive";
  let disabled = true;
  let passwordValue = "";
  let connMessage = ""
  // Methods used to toggle classes and perform requests
  const showPassword = () => {
    openOrClosed === "fa-eye-slash"
      ? (openOrClosed = "fa-eye")
      : (openOrClosed = "fa-eye-slash");
    showPass === "password" ? (showPass = "text") : (showPass = "password");
  };
  const getPassword = e => {
    passwordValue = e.target.value;
    passwordValue.length > 0 ? (disabled = false) : (disabled = true);
    passwordValue.length > 0 ? (active = "btn") : (active = "btn-deactive");
  };
  const connectToNetwork = async () => {
    if(passwordValue.length > 0){
       connecting = true;
       const getMessage = netConnect(passwordValue, selected.ssid)
       const messageBack = await getMessage
       console.log(messageBack)
       if(messageBack.message === "Connection successful"){
         connMessage = messageBack.message
         connecting = false
         setTimeout(() => {
           closeModal()
           connMessage = ""
         }, 1000)
       } else if(messageBack.message === "Sorry there was a problem connecting") {
         connMessage = messageBack.message
         connecting = false
       }
    }
  };
</script>

<style>
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
  /* .input-field:focus {
    border: 1px solid dodgerblue;
  } */
  .btn {
    background-color: dodgerblue;
    color: white;
    padding: 15px 20px;
    border: none;
    cursor: pointer;
    width: 100%;
    opacity: 0.9;
    height: 50px;
  }
  .btn:hover {
    opacity: 1;
  }
  .btn-deactive {
    background-color: rgb(206, 206, 206);
    color: white;
    padding: 15px 20px;
    border: none;
    width: 100%;
    opacity: 0.9;
    height: 50px;
  }
</style>

{#if show}
  <div id="myModal" class="modal">
    <div class="modal-content">
      <span class="close" on:click={closeModal}>&times;</span>
      <div class="connect-content">
        <h3>You are attempting to connect to:</h3>
        <h4>{selected.ssid}</h4>
        <p>Please enter a password and click connect</p>
        <div class="input-container">
          <i class={`fas ${openOrClosed} icon`} on:click={showPassword} />
          <input
            on:keyup={getPassword}
            class="input-field"
            type={showPass}
            placeholder="password"
            name="usrname" />
        </div>
        <p>{ connMessage }</p>
        <button
          type="submit"
          class={active}
          on:click={connectToNetwork}
          {disabled}>
          {#if !connecting}
            Connect
          {:else}
            <MiniLoader />
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
