class LazyLoading {

    constructor() {
        this.loadedImages = [];
        this.imagesQueue = [];
        this.ajaxQueueBusy = false;
        this.firstImageIntersected = false;

        this.runImageQueueHandler();
        this.runObserver();

    }

    runObserver() {

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.addToAjaxQueue( $(entry.target) );
                    this.firstImageIntersected = true;
                    observer.unobserve(entry.target)
                }
            })
        }, { threshold: 0 })
    
        let elemsToLoad = document.querySelectorAll('span.media-lazy:not(.loaded)')
        elemsToLoad.forEach(e => observer.observe(e) );
        console.log(elemsToLoad)
        
    }

    addImageToLoaded( imageSrc, imageUrl ) {

        let item = {
            imageSrc: imageSrc,
            imageUrl: imageUrl }

        this.loadedImages.push(item)

    }

    insertImage( $target, imageUrl ) {
        $target.find('.img').removeAttr('data-src').css('background-image', `url(${imageUrl})`);
        $target.removeClass('loading').addClass('loaded')
    }

    imageIsLoaded( imageSrc ) {
        return this.loadedImages.find(item => item.imageSrc === imageSrc);
    }

    getFileName( src ) {
        return src.split('/').pop();
    } 

    addToAjaxQueue( $target ) {

        $target.addClass('loading');
        let imageSrc = $target.find('.img').data('src');

        let queueItem = {
            target: $target,
            imageSrc: imageSrc,
        }

        this.imagesQueue.push( queueItem );

    }

    runImageQueueHandler() {

        if( this.ajaxQueueBusy == false && this.firstImageIntersected && this.imagesQueue.length > 0 ) {

            this.ajaxQueueBusy = true;

            let queueItem = this.imagesQueue.shift();

            let $target = queueItem.target;
            let imageSrc = queueItem.imageSrc;

            let loadedItem = this.imageIsLoaded(imageSrc) ?? false;

            if( loadedItem ) {

                this.insertImage($target, loadedItem.imageUrl);
                this.ajaxQueueBusy = false;
    
            } else {
    
                this.ajaxLoadImage($target, imageSrc);
    
            }

        }

        setTimeout(() => {
            requestAnimationFrame( () => this.runImageQueueHandler() );
        }, 100);

    }

    ajaxLoadImage( $target, imageSrc ) {
        $.ajax({
            url: imageSrc,
            type: 'GET',
            xhrFields: {
                responseType: 'blob',
            }
        }).done((responce) => {
            if (responce instanceof Blob) {
                var objectUrl = URL.createObjectURL(responce);
                this.addImageToLoaded( imageSrc, objectUrl )
                this.insertImage( $target, objectUrl );
                this.ajaxQueueBusy = false;
            } else {
                this.ajaxQueueBusy = false;
            }
        }).fail(() => {
            this.ajaxQueueBusy = false;
        })
    }

}
