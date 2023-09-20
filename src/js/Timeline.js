import Tooltip from "../../Tooltip/Tooltip"
import "../../Tooltip/style.css"

export default class Timeline {
    constructor(container){
        this.container = container
        this.posts = document.querySelector('.chat-content')
        this.messageForm = container.querySelector('.chat-input')
        this.audioButton = container.querySelector('.audio-button')
        this.videoButton = container.querySelector('.video-button')
        this.videoRecorder = container.querySelector('.video-recorder')
        this.finishRecordButton = container.querySelector('.ok-button')
        this.cancelRecordButton = container.querySelector('.cancel-button')
        this.tooltipFactory = new Tooltip()
        this.timer = container.querySelector('.timer')
        this.timerInterval = undefined
        this.counter = 1
        

        this.sendTextPost = this.sendTextPost.bind(this)
        this.audioHandler = this.audioHandler.bind(this)
        this.videoHandler = this.videoHandler.bind(this)
        this.getCoords = this.getCoords.bind(this)
        this.coordsFormHandler = this.coordsFormHandler.bind(this)
        this.finishRecordCallback = this.finishRecordCallback.bind(this)
        this.cancelRecordCallback = this.cancelRecordCallback.bind(this)
    }

    init(){
        this.messageForm.addEventListener('submit', this.sendTextPost)
        this.audioButton.addEventListener('click', this.audioHandler)
        this.videoButton.addEventListener('click', this.videoHandler)

        document.querySelector('.coords-form-cancel-button').addEventListener('click', () => {
            this.closeRequestCoordsForm(document.querySelector('.request-coords-form'))
        })

        document.querySelector('.close-warning').addEventListener('click', () => {
            document.querySelector('.media-unavailable').classList.remove('show')
        })

        
    }

    async sendTextPost(event){
        event.preventDefault()
                
        const textContent = event.target.querySelector('.chat-message').value
        const date = Date.now()
        
        event.target.querySelector('.chat-message').value = ''
        this.renderPost(textContent, date)
    }

    
    renderPost(content, date){
        const post = document.createElement('div')
        post.classList.add('post')
        post.innerHTML = 
        `
        <div class="post-date"></div>
        <div class="post-content"></div>
        <div class="post-coords"></div>
        `
        post.querySelector('.post-date').innerText = Timeline.formatDate(new Date(date))
        post.querySelector('.post-content').innerText = content
        this.addCoordsToPost(post)
        this.posts.appendChild(post)
        return post
    }


    addCoordsToPost(post){
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
            (data) => {this.getCoords(data, post)},
            (err) => {
                console.log(err)
                this.getManualInputedCoords(post) 
            },
            { enableHighAccuracy: true }
            );
         }
            
    }

    getCoords(data, post){
        // console.log(data)
        const { latitude, longitude } = data.coords;
        this.renderCoords({latitude, longitude}, post)
    }

    renderCoords(coords, post){
        post.querySelector('.post-coords').innerText = `[${coords.latitude}, ${coords.longitude}]`
    }

    getManualInputedCoords(post){
        const coordForm = this.toggleRequestCoordsFormModal()
        this.callback = this.coordsFormHandler.bind(this, post)
        coordForm.addEventListener('submit', this.callback)
        

    }

    toggleRequestCoordsFormModal(){
        const modal = document.querySelector('.coords-form-modal')
        modal.classList.toggle('show')
        return modal.querySelector('.request-coords-form')
    }

    coordsFormHandler(post, event){
        event.preventDefault()
        this.tooltipFactory.removePopover(event.target.querySelector('.coords-input'))
        const coordsData = event.target.querySelector('.coords-input').value
        const coords = this.checkValidity(coordsData)
        if(coords){
            this.renderCoords(coords, post)
            this.closeRequestCoordsForm(event.target)
            // event.target.reset()
            // this.toggleRequestCoordsFormModal()
            // event.target.removeEventListener('submit', this.callback)
        } else {
            console.log('neeennn')
            this.tooltipFactory.showPopover({
                title: 'Некорректные координаты',
                content: 'Вы ввели некоректные данные. Введите координаты в указанном формате, через запятую.'
            }, event.target.querySelector('.coords-input'))
        }
    }

    closeRequestCoordsForm(form){
        form.reset()
        this.toggleRequestCoordsFormModal()
        form.removeEventListener('submit', this.callback)
    }
  

    checkValidity(str){
        const regex = /\[?(-?\d{1,2}\.\d{5}),\s?(-?\d{1,2}\.\d{5})]?/
        const res = str.match(regex)
        return res && {latitude:res[1], longitude:res[2]}

    }
   
    static formatDate(date) {
        let dayOfMonth = date.getDate();
        let month = date.getMonth() + 1;
        let year = date.getFullYear();
        let hour = date.getHours();
        let minutes = date.getMinutes();
    
        year = year.toString().slice(-2);
        month = month < 10 ? `0${month}` : month;
        dayOfMonth = dayOfMonth < 10 ? `0${dayOfMonth}` : dayOfMonth;
        hour = hour < 10 ? `0${hour}` : hour;
        minutes = minutes < 10 ? `0${minutes}` : minutes;
    
        return `${dayOfMonth}.${month}.${year} ${hour}:${minutes}`;
    }

    async audioHandler(event){
        let stream = null
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio:true            
            })
        }
        catch (err){
            console.log(err)
            this.showMediaUnavailableWarning()
            return
        } 
        this.toggleRecordButtons()
        this.renderAudioPost(stream)
        //ToDo

    }

    renderAudioPost(stream){
        const recorder = new MediaRecorder(stream);
        const chunks = [];

        recorder.addEventListener("dataavailable", (event) => {
            chunks.push(event.data);
        });

        recorder.addEventListener("stop", () => {
            const blob = new Blob(chunks);

            const newPost = this.renderPost('', Date.now())

            const audioContent = document.createElement('audio')
            videoContent.setAttribute('controls', 'controls')
            videoContent.classList.add('post-audio-content')
            videoContent.src = URL.createObjectURL(blob);

            newPost.querySelector('.post-content').appendChild(audioContent)
            this.toggleRecordButtons()
            this.finishRecordButton.removeEventListener("click", this.finishRecordCallback)
        });

        recorder.start();
        this.finishRecordButton.addEventListener("click", this.finishRecordCallback);
    }

    toggleRecordButtons(){
        this.container.querySelector('.audio-video').classList.toggle('hide')
        this.container.querySelector('.record-buttons').classList.toggle('show-flex')
        if(this.counter === 1){
            this.startTimer()
        } else {
            this.stopTimer()
        }
    }

    toggleVideoRecorder(){
        this.toggleRecordButtons()
        this.videoRecorder.classList.toggle('show')
    }

    async videoHandler(event){
        let stream = null
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video:true,
                audio:true            
            })
        }
        catch (err){
            console.log(err)
            this.showMediaUnavailableWarning()
            return
        } 

        this.toggleVideoRecorder()
        
        this.videoRecorder.srcObject = stream
        this.videoRecorder.addEventListener('canplay', () => { 
            console.log(this)
            this.videoRecorder.play()
        })

        this.renderVideoPost(stream)     
    }

    renderVideoPost(stream){
        const recorder = new MediaRecorder(stream);
        const chunks = [];

        recorder.addEventListener("dataavailable", (event) => {
            chunks.push(event.data);
        });

        recorder.addEventListener("stop", () => {
            if(this.stopRequester === 'finish'){
                const blob = new Blob(chunks);
    
                const newPost = this.renderPost('', Date.now())
    
                const videoContent = document.createElement('video')
                videoContent.setAttribute('controls', 'controls')
                videoContent.classList.add('post-video-content')
                videoContent.src = URL.createObjectURL(blob);
    
                newPost.querySelector('.post-content').appendChild(videoContent)
            }
            this.toggleVideoRecorder()
            this.finishRecordButton.removeEventListener("click", this.finishRecordCallback)
            this.cancelRecordButton.removeEventListener("click", this.cancelRecordCallback);
        });

        recorder.start();
        
        this.finishRecordButton.addEventListener("click", this.finishRecordCallback);
        this.cancelRecordButton.addEventListener("click", this.cancelRecordCallback);

    }

    finishRecordCallback(){
        this.stopRequester = 'finish'
        this.stopRecording()
        // recorder.stop();
        // stream.getTracks().forEach((track) => track.stop());
    }

    cancelRecordCallback(){
        this.stopRecording()
        // recorder.stop();
        // stream.getTracks().forEach((track) => track.stop());
    }

    stopRecording(){
        recorder.stop();
        stream.getTracks().forEach((track) => track.stop());
    }



    showMediaUnavailableWarning(){
        document.querySelector('.media-unavailable').classList.add('show')
    }

    startTimer(){
        this.timerInterval = setInterval(() => {
            this.timer.innerText = Timeline.formatTimer(this.counter)
            this.counter += 1
        }, 1000)
    }

    static formatTimer(time){
        let minutes = Math.floor(time / 60)
        let seconds = time - minutes * 60

        minutes = minutes < 10 ? `0${minutes}` : minutes;
        seconds = seconds < 10 ? `0${seconds}` : seconds;

        return `${minutes}:${seconds}`
    }

    stopTimer(){
        clearInterval(this.timerInterval)
        this.counter = 1
        this.timer.innerText = '00:00'        
    }

   

}



