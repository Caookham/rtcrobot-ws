// zoom in/out on the section
    let scale = 1
    const factor = 0.05
    const max_scale =6
    // drag the section
    // when mouse is pressed store the current mouse x,y
    let previousX, previousY
    let currentPos = {x:0, y:0}
    document.getElementById("viewer").addEventListener('mousedown', (event) => {
    previousX = event.pageX
    previousY = event.pageY
    document.getElementById("viewer").style.cursor = 'move'
    })

    document.getElementById("viewer").addEventListener('mouseup', (event) => {
    document.getElementById("viewer").style.cursor = 'auto'
    })

    // when mouse is moved, scrollBy() the mouse movement x,y
    document.getElementById("viewer").addEventListener('mousemove', (event) => {
        // only do this when the primary mouse button is pressed (event.buttons = 1)
      if (event.buttons) {
        let dragX = 0
        let dragY = 0
        // skip the drag when the x position was not changed
        if (event.pageX - previousX !== 0) {
          dragX = previousX - event.pageX
          previousX = event.pageX
        }
        // skip the drag when the y position was not changed
        if (event.pageY - previousY !== 0) {
          dragY = previousY - event.pageY
          previousY = event.pageY
        }
        // scrollBy x and y
        if (dragX !== 0 || dragY !== 0) {
            currentPos.x -=dragX;
            currentPos.y -=dragY;
          document.getElementById("viewer").style.transform = `translate(${currentPos.x}px,${currentPos.y}px) scale(${scale}, ${scale})`
        }
      }
    })

    

document.getElementById("map-contain").addEventListener('wheel', (e) => {
    e.preventDefault();
    var delta = e.delta || e.wheelDelta;
    if (delta === undefined) {
      //we are on firefox
      delta = e.originalEvent.detail;
    }
    delta = Math.max(-1,Math.min(1,delta)) // cap the delta to [-1,1] for cross 
    // apply zoom
    scale += delta*factor * scale
    scale = Math.max(0.5,Math.min(max_scale,scale))

    document.getElementById("viewer").style.transform = `translate(${currentPos.x}px,${currentPos.y}px) scale(${scale}, ${scale})`
    

  })
