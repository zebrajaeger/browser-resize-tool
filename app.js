// ---------------------------------------------------------------------------
// DnD
// ---------------------------------------------------------------------------

const dropArea = document.getElementById('drop-area');

;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false)
})

function preventDefaults(e) {
    e.preventDefault()
    e.stopPropagation()
}

;['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false)
})

;['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false)
})

function highlight(e) {
    dropArea.classList.add('highlight')
}

function unhighlight(e) {
    dropArea.classList.remove('highlight')
}

dropArea.addEventListener('drop', handleDrop, false)

function handleDrop(e) {
    let dt = e.dataTransfer
    let files = dt.files

    handleFiles(files)
}

function handleFiles(files) {
    const maxBounds = parseInt($('#bounds').val());
    if (isNaN(maxBounds)) {
        alert('Set bounds first');
    } else {
        console.log('Bounds', maxBounds)
        ;([...files]).forEach((f) => previewFile(f, maxBounds));
    }
}

// ---------------------------------------------------------------------------
// RESIZE
// ---------------------------------------------------------------------------

function previewFile(file, maxBounds) {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = function (e) {
        const img = document.createElement("img");
        img.onload = function (event) {
            const $copyable = $('<div class="copyable"></div>');
            $copyable.click(copyImage);
            const $img = $('<img class="preview"></img>')
            $copyable.append($img);
            $('#gallery').append($copyable);

            $img.attr('src', downscale(img, maxBounds));
        }
        img.src = reader.result;
    }
}

function downscale(img, maxBounds) {
    const scaleFactor = 0.5;

    const canvas1 = document.createElement('canvas');
    const canvasContext1 = canvas1.getContext("2d");
    const canvas2 = document.createElement('canvas');
    const canvasContext2 = canvas2.getContext("2d");
    const resultCanvas = document.createElement('canvas');
    const resultContext = resultCanvas.getContext('2d');

    let w = img.width;
    let h = img.height;
    canvas1.width = Math.floor(img.width * scaleFactor);
    canvas1.height = Math.floor(img.height * scaleFactor);
    canvas2.width = Math.floor(img.width * scaleFactor * scaleFactor);
    canvas2.height = Math.floor(img.height * scaleFactor * scaleFactor);

    const scale = Math.max(img.width / maxBounds, img.height / maxBounds);
    const targetW = Math.floor(img.width / scale);
    const targetH = Math.floor(img.height / scale);
    resultCanvas.width = targetW;
    resultCanvas.height = targetH;

    let canvasSwitch = undefined; // undefined: src = img, false = 1: true = 2

    while (w > maxBounds && h > maxBounds) {
        const newW = w * scaleFactor;
        const newH = h * scaleFactor;
        if (canvasSwitch === undefined) {
            canvasContext1.drawImage(img, 0, 0, w, h, 0, 0, newW, newH);
            canvasSwitch = false;
        } else if (canvasSwitch === false) {
            canvasContext2.drawImage(canvas1, 0, 0, w, h, 0, 0, newW, newH);
            canvasSwitch = true;
        } else if (canvasSwitch === true) {
            canvasContext1.drawImage(canvas2, 0, 0, w, h, 0, 0, newW, newH);
            canvasSwitch = false;
        }
        w = newW;
        h = newH;
    }

    console.log({canvasSwitch, w, h})
    if (canvasSwitch === undefined) {
        resultContext.drawImage(img, 0, 0, w, h, 0, 0, targetW, targetH);
    } else if (canvasSwitch === false) {
        resultContext.drawImage(canvas1, 0, 0, w, h, 0, 0, targetW, targetH);
    } else if (canvasSwitch === true) {
        resultContext.drawImage(canvas2, 0, 0, w, h, 0, 0, targetW, targetH);
    }

    return resultCanvas.toDataURL()
}

// ---------------------------------------------------------------------------
// CLIPBOARD
// ---------------------------------------------------------------------------
$(".copyable").click(copyImage);

function copyImage(e) {
    console.log('COPY', this, e)
    //Make the container Div contenteditable
    $(this).attr("contenteditable", true);
    //Select the image
    selectText($(this).get(0));
    //Execute copy Command
    //Note: This will ONLY work directly inside a click listenner
    document.execCommand('copy');
    //Unselect the content
    window.getSelection().removeAllRanges();
    //Make the container Div uneditable again
    $(this).removeAttr("contenteditable");
    //Success!!
    //alert("image copied!");
}

function selectText(element) {
    if (document.body.createTextRange) {
        const range = document.body.createTextRange();
        range.moveToElementText(element);
        range.select();
    } else if (window.getSelection) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

// UI

$('#bounds').change(() => {
    $('#bounds-pre').val($('#bounds').val());
})
$('#bounds-pre').change(() => {
    $('#bounds').val($('#bounds-pre').val());
})
