class Note {
  constructor(id, title, text) {
    this.id = id;
    this.title = title;
    this.text = text;
  }
}

class App {
  constructor() {
//this.notes =JSON.parse(localStorage.getItem('notes')) || [];
    this.notes = [];
    this.selectedNoteId = "";
    this.miniSidebar = true;
    this.userId = "";

    this.$form = document.querySelector(".form")
    this.$activeForm = document.querySelector(".active-form");
    this.$inactiveForm = document.querySelector(".inactive-form");
    this.$noteTitle = document.querySelector("#note-title");
    this.$noteText = document.querySelector("#note-text");
    this.$notes = document.querySelector(".notes");
   // this.$note = document.querySelector(".note")
    this.$modal = document.querySelector(".modal");
    this.$modalForm = document.querySelector("#modal-form")
    this.$modalTitle = document.querySelector("#modal-title");
    this.$modalText = document.querySelector("#modal-text");
    this.$closeModalForm = document.querySelector("#modal-button");
    this.$sidebar = document.querySelector(".sidebar");
    this.$sidebarActiveItem= document.querySelector(".active-item");
    this.$app = document.querySelector("#app")
    this.$firebaseAuthContainer = document.querySelector("#firebaseui-auth-container")
    this.$authUserText =  document.querySelector(".auth-user")
    this.$logOutButton = document.querySelector(".logout")
    
   
    const firebaseConfig = {
      apiKey: "AIzaSyBFep5gmWgDYx4H0XQRQ7ARDUjJDPaVOtk",
      authDomain: "keep-616f4.firebaseapp.com",
      projectId: "keep-616f4",
      storageBucket: "keep-616f4.firebasestorage.app",
      messagingSenderId: "443325408515",
      appId: "1:443325408515:web:74022b72371c22fcf47536"
    };
    // Initialize Firebase
    const app = firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    this.db = firebase.firestore();
 
    console.log(firebase);
    console.log(app);
    console.log(auth);

  
     this.ui = new firebaseui.auth.AuthUI(firebase.auth());
     this.handleAuth();
   
    this.addEventListeners();
    this.displayNotes();
  }

  handleAuth(){
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/v8/firebase.User\
        //  console.log(user.uid) to see if we are logged in
         this.userId = user.uid
        this.$authUserText.innerHTML = user.displayName;
        this.redirectToApp();
        this.ui.reset()
      
      } else {
        // User is signed out
        this.redirectToAuth();
      }
    });
  }
  
  handleLogOut(){
    firebase.auth().signOut().then(() => {
      // Sign-out successful.
      this.redirectToAuth();
      
    }).catch((error) => {
      // An error happened.
      console.log("an error occured")
    });
  }
  redirectToApp(){
         this.$firebaseAuthContainer.style.display = "none";
         this.$app.style.display ="block";
         this.fetchNotesFromDB();    
  }
  
  redirectToAuth(){
       this.$firebaseAuthContainer.style.display = "block";
       this.$app.style.display ="none";
          
        this.ui.start('#firebaseui-auth-container', {
          callbacks: {
            signInSuccessWithAuthResult: (authResult, redirectUrl) => {
              // User successfully signed in.
              // Return type determines whether we continue the redirect automatically
              // or whether we leave that to developer to handle.+
              console.log(authResult.user.uid)
              this.userId = authResult.user.uid;
              this.$authUserText.innerHTML = authResult.user.displayName;
              this.redirectToApp();
             
             return false // prevent automatic redirect
            },
          },
           signInFlow: "redirect", 
           signInOptions: [
        {
          provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
          signInMethod: firebase.auth.EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD,
          requireDisplayName: false 
        },
          firebase.auth.GoogleAuthProvider.PROVIDER_ID
       ],
          // Other config options...
          credentialHelper: firebaseui.auth.CredentialHelper.NONE,
          signInSuccessUrl: null, 
        }) 
    }
   
  addEventListeners() {
    document.body.addEventListener("click", (event) => {
      this.handleFormClick(event);
      this.closeModal(event);
      this.openModal(event);
      this.handleArchiving(event)
      
    });

    this.$form.addEventListener("submit", (event) => {
      event.preventDefault();
      const title = this.$noteTitle.value;
      const text = this.$noteText.value;
      this.addNote({ title, text });
      this.closeActiveForm();
    });

    this.$modalForm.addEventListener("submit", (event) => {
      event.preventDefault();
      
    });
    this.$sidebar.addEventListener("mouseover", () =>{
         this.handleToggleSidebar();
    });
    this.$sidebar.addEventListener("mouseout", () =>{
      this.handleToggleSidebar();
 })

 this.$logOutButton.addEventListener("click", (event)=>{
  this.handleLogOut()
 })
}




  handleFormClick(event) {
    const isActiveFormClickedOn = this.$activeForm.contains(event.target);
    const isInactiveFormClickedOn = this.$inactiveForm.contains(event.target);
    const title = this.$noteTitle.value;
    const text = this.$noteText.value;

    if (isInactiveFormClickedOn) {
      this.openActiveForm();
      return;
    }
    else if(!isInactiveFormClickedOn && !isActiveFormClickedOn) {
      this.addNote({ title, text });
      this.closeActiveForm();
    }
  }

  openActiveForm() {
    this.$inactiveForm.style.display = "none";
    this.$activeForm.style.display = "block";
    this.$noteText.focus();
  }

  closeActiveForm() {
    this.$inactiveForm.style.display = "block";
    this.$activeForm.style.display = "none";
    this.$noteText.value = "";
    this.$noteTitle.value = "";
  }

  openModal(event) {
  const $selectedNote = event.target.closest(".note");
   
    if($selectedNote && !event.target.closest(".archive")) {
      //console.log( $selectedNote.children.innerHTML)
      //console.log($selectedNote.id)
      this.selectedNoteId = $selectedNote.id;
      this.$modalTitle.value = $selectedNote.children[1].innerHTML;
      this.$modalText.value = $selectedNote.children[2].innerHTML;
      this.$modal.classList.add("open-modal");
    } else{
      return;
    }
  }
 
  closeModal(event){
    const isModalFormClickedOn = this.$modalForm.contains(event.target);
    const isCloseModalButtonClickedOn = this.$closeModalForm.contains(event.target);
    //console.log(isModalCloseButtonClickedOn)
    if((!isModalFormClickedOn || isCloseModalButtonClickedOn) && this.$modal.classList.contains("open-modal")){
      this.editNote(this.selectedNoteId, {
        title: this.$modalTitle.value,
        text:this.$modalText.value,
       });
      this.$modal.classList.remove("open-modal");
    }
  }

  handleArchiving(event){
    const $selectedNote = event.target.closest(".note");
  
    if($selectedNote && event.target.closest(".archive")) {
      this.selectedNoteId = $selectedNote.id;
      this.deleteNote(this.selectedNoteId);
    }
  }

  addNote({ title, text }) {
    if (text != "") {
      const newNote = {id: cuid(), title, text};
      this.notes = [...this.notes, newNote];
      this.render();
    }
  }

  editNote(id, { title, text }) {
         this.notes = this.notes.map((note) => {
           if (note.id == id) {
             note.title = title;
             note.text = text;
           }
           return note;
         })
         this.render()
  }

  handleMouseOverNote(element) {
    const $note = document.querySelector("#"+element.id);
    const $checkNote = $note.querySelector(".check-circle");
    const $noteFooter = $note.querySelector(".note-footer");
    $checkNote.style.visibility = "visible";
    $noteFooter.style.visibility = "visible";
  }

  handleMouseOutNote(element) {
    const $note = document.querySelector("#"+element.id);
    const $checkNote = $note.querySelector(".check-circle");
    const $noteFooter = $note.querySelector(".note-footer");
    $checkNote.style.visibility = "hidden";
    $noteFooter.style.visibility = "hidden";
  }

  deleteNote(id) {
    this.notes = this.notes.filter((note) => note.id != id);
    this.render();
  }


  handleToggleSidebar(){
    if(this.miniSidebar){
      this.$sidebar.style.width = "180px";
      this.$sidebar.classList.add("sidebar-hover")
     this.$sidebarActiveItem.classList.add("sidebar-active-item")
      this.miniSidebar= false;
    }else{
       this.$sidebar.style.width = "60px";
       this.$sidebar.classList.remove("sidebar-hover")
       this.$sidebarActiveItem.classList.remove("sidebar-active-item")
       this.miniSidebar = true;
     }
   }

   fetchNotesFromDB(){
    
         ///retrieving data 
         var docRef = this.db.collection("users").doc(this.userId);
          
           docRef.get().then((doc) => {
               if (doc.exists) {
                   console.log("Document data:", doc.data().notes);
                   this.notes = doc.data().notes;
                   this.displayNotes();
               } else {
                   // doc.data() will be undefined in this case
                   console.log("No such document!");
                   console.log(this.userId)
                  this.db.collection("users").doc("this.userId").set({
                       notes: []
                     })
                     .then(() => {
                       console.log("user successfully created!");
                     })
                     .catch((error) => {
                       console.error("Error writing document: ", error);
                     });
               }
           }).catch((error) => {
               console.log("Error getting document:", error);
           });

   }
    
   saveNotes(){
            //localStorage.setItem('notes', JSON.stringify(this.notes));
          //data added to firestore cloud
         // Add a new document in collection "cities"
        // console.log(this.$userId);
     
      console.log(this.userId)
        //  const db = firebase.firestore();
       this.db.collection("users").doc("this.userId").set({
           notes: this.notes
         })
         .then(() => {
           console.log("Document successfully written!");
         })
         .catch((error) => {
           console.error("Error writing document: ", error);
         });
   }


   render(){
    this.saveNotes();
    this.displayNotes();
   }

  
  displayNotes() {
    this.$notes.innerHTML = this.notes
      .map(
        (note) =>
          `
        <div class="note" id="${note.id}" onmouseover="app.handleMouseOverNote(this)" onmouseout="app.handleMouseOutNote(this)">
          <span class="material-symbols-outlined check-circle"
            >check_circle</span
          >
          <div class="title">${note.title}</div>
          <div class="text">${note.text}</div>
          <div class="note-footer">
            <div class="tooltip">
              <span class="material-symbols-outlined hover small-icon"
                >add_alert</span
              >
              <span class="tooltip-text">Remind me</span>
            </div>
            <div class="tooltip">
              <span class="material-symbols-outlined hover small-icon"
                >person_add</span
              >
              <span class="tooltip-text">Collaborator</span>
            </div>
            <div class="tooltip">
              <span class="material-symbols-outlined hover small-icon"
                >palette</span
              >
              <span class="tooltip-text">Change Color</span>
            </div>
            <div class="tooltip">
              <span class="material-symbols-outlined hover small-icon"
                >image</span
              >
              <span class="tooltip-text">Add Image</span>
            </div>
            <div class="tooltip archive">
              <span class="material-symbols-outlined hover small-icon"
                >archive</span
              >
              <span class="tooltip-text" >Archive</span>
            </div>
            <div class="tooltip">
              <span class="material-symbols-outlined hover small-icon"
                >more_vert</span
              >
              <span class="tooltip-text">More</span>
            </div>
          </div>
        </div>
        `
      )
      .join("");
  }

 
}

const app = new App();
