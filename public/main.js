//param - color 1 (the first hex color) - string
//param - color 2 (the second hex color) - string
//param - weight (balance between the 2 colors) - number 50/50
//returns - The mixed color string

//Mix a saved color with a selected color
//Preview mixed color withouth changing the original color 
//Save the result as a new color 
//Allow user to delete saved colors

function mixHexColors(color1,color2,weight = 0.5) { 

  //remove the # from each hex color 
  const cleanHex1 = color1.substring(1); 
  const cleanHex2 = color2.substring(1); 

  //gets the rgb values of color #1 
  const r1 = parseInt(cleanHex1.substring(0, 2), 16);
  const g1 = parseInt(cleanHex1.substring(2, 4), 16);
  const b1 = parseInt(cleanHex1.substring(4, 6), 16);

  //gets the rgb values of color #2
  const r2 = parseInt(cleanHex2.substring(0, 2), 16);
  const g2 = parseInt(cleanHex2.substring(2, 4), 16);
  const b2 = parseInt(cleanHex2.substring(4, 6), 16);

  //THE MATH OF IT  - calculates the average between the 2 colors
  const r = Math.round(r1 + (r2 - r1) * weight);
  const g = Math.round(g1 + (g2 - g1) * weight);
  const b = Math.round(b1 + (b2 - b1) * weight);

  //convert rgb value back into hex value
  const toHex = function(channel) { 
    return channel.toString(16).padStart(2, '0'); 
  }; 

  //RETURN the mixed color 
    return '#' + toHex(r) + toHex(g) + toHex(b);
}



// Find every saved color card on the page
const colorCards = document.querySelectorAll('.color-card');

colorCards.forEach(function(card) {

    // Get the original color saved in this card
    const baseColor = card.dataset.hex;

    // Find the color picker, preview, hex #, mix color, and save button
    const picker = card.querySelector('.mix-picker');
    const preview = card.querySelector('.mixed-preview');
    const hexLabel = card.querySelector('.mixed-hex');

    const mixButton = card.querySelector('.mix-btn');
    const saveButton = card.querySelector('.save-mix-btn');

    let mixedHex = baseColor;

    let hasPreviewedMix = false;

    // Calculate and display mixed color
    function updatePreview() {
        mixedHex = mixHexColors(baseColor, picker.value, 0.5);
        preview.style.backgroundColor = mixedHex;
        hexLabel.textContent = mixedHex;
        hasPreviewedMix = true;
        saveButton.disabled = false;
    }

    // Update the preview whenever the user changes the color picker
    picker.addEventListener('input', function() {
        updatePreview();
    });

    //Preview the mixed color
    mixButton.addEventListener('click', function() {
        updatePreview();
    });

  
    //save the mixed color
    saveButton.addEventListener('click', function() {

         // Require a preview before saving
        if (hasPreviewedMix === false) {
            alert('Choose a color and preview your mix first.');
            return;
        }

        // Send the mixed HEX value to the existing POST route
        fetch('/colors', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                hex: mixedHex
            })
        })

        .then(function(response) {

            // Stop if the server could not save the color
            if (response.ok === false) {
                return response.text().then(function(message) {
                    throw new Error(message);
                });
            }

            // The new color has been saved
            window.location.href = '/profile';
        })

        .catch(function(error) {
            console.error('Error saving mixed color:', error);
            alert('Could not save the mixed color.');
        });
    });

    // Show the original color until the user previews a mix
    preview.style.backgroundColor = baseColor;
    hexLabel.textContent = baseColor;

    // Do not save until a mix has been previewed
    saveButton.disabled = true;
});



// ================================================
// DELETE A SAVED COLOR
// ================================================

// Find every Delete button
const deleteButtons = document.querySelectorAll('.delete-btn');

deleteButtons.forEach(function(button) {
    button.addEventListener('click', function() {
        const card = button.closest('.color-card');
        const id = card.dataset.id; //Get the MongoDB document ID from the card
        const confirmed = window.confirm(
            'Are you sure you want to delete this color?'
        );
        if (confirmed === false) {
            return;
        }
        fetch('/colors', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: id
            })
        })
        // Check whether the server deleted the color
        .then(function(response) {
            if (response.ok) {
                window.location.href = '/profile';
                return; 
            } 
            
            return response.text().then(function(message) {
                alert('Could not delete color: ' + message);
            });
        })

        .catch(function(error) {
            console.error('Error deleting color:', error);
            alert('Something went wrong while deleting the color.');
        });
    });
});



const trash = document.getElementsByClassName("delete-color");

Array.from(trash).forEach(function(element) {
      element.addEventListener('click', function(){
        //const name = this.parentNode.parentNode.childNodes[1].innerText
        //const msg = this.parentNode.parentNode.childNodes[3].innerText
        // const id = this.parentNode.parentNode.childNodes[1].dataset.messageId
        const id = this.dataset.id

        fetch('trash', {
          method: 'delete',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            'id': id
          })
        }).then(function (response) {
          window.location.reload()
        })
      });
});



//Mix current color with other color
document.querySelectorAll('.mix-btn').forEach(button => {
  button.addEventListener('click', function () {
    const card = this.closest('.color-card');
    const id = card.dataset.id;
    const currentColorHex = card.dataset.hex;
    const targetMixHex = card.querySelector('.mix-picker').value;

    // Calculate mixed color using 50/50 ratio
    const newMixedHex = mixHexColors(currentColorHex, targetMixHex, 0.5);

    fetch('/colors', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: id,
        hex: newMixedHex
      })
    })
    .then(res => {
      if (res.ok) window.location.reload();
    })
    .catch(err => console.error('Error updating mixed color:', err));
  });
});

// =============================================================================
// DELETE ROUTE (DELETE) - Remove Color Entry
// =============================================================================
document.querySelectorAll('.delete-btn').forEach(button => {
  button.addEventListener('click', function () {
    const card = this.closest('.color-card');
    const id = card.dataset.id;

    fetch('/colors', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id })
    })
    .then(res => {
      if (res.ok) window.location.reload();
    })
    .catch(err => console.error('Error deleting color:', err));
  });
});



Array.from(trash).forEach(function(element) {
      element.addEventListener('click', function(){
        //const name = this.parentNode.parentNode.childNodes[1].innerText
        //const msg = this.parentNode.parentNode.childNodes[3].innerText
        const id = this.parentNode.parentNode.childNodes[1].dataset.messageId

        fetch('trash', {
          method: 'delete',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            'id': id
          })
        }).then(function (response) {
          window.location.reload()
        })
      });
});
