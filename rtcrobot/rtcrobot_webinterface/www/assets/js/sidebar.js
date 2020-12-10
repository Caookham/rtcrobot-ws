(function($) {
    
    let win = $(window);
    let w = win.width();
    
    let body = $('body');
    let btn = $('#sidebarToggleClose');
    let btn_open = $('#sidebarToggleOpen');
    let sidebar = $('.sidebar');
    
    // Collapse on load
    // Collapse la thu ve
    if (win.width() < 992) {
        sidebar.addClass('collapsed');
    }
    
    sidebar.removeClass('mobile-hid');
    
    // Events
    
    btn.click(toggleSidebar);
    btn_open.click(toggleSidebar);

    win.resize(function() {
        
        if (w==win.width()) {
            return;
        }
        
        w = win.width();
        
        if (w < 992 && !sidebar.hasClass('collapsed')) {
            toggleSidebar();
        } else if (w > 992 && sidebar.hasClass('collapsed')) {
            toggleSidebar();
        }
    });
    
    function toggleSidebar() { 
        
        if (win.width() < 992 || !sidebar.hasClass('collapsed')) {
            body.animate({'padding-left':'0'},100);
        }
        else if (win.width() > 992 && sidebar.hasClass('collapsed')) {
            body.animate({'padding-left':'0'},100);
        }
        
        if (!sidebar.hasClass('collapsed')) {
            //chua thu ve
            sidebar.fadeOut(100,function(){
                btn.hide();
                sidebar.addClass('collapsed');
                //btn.fadeIn(100);
            });
            
        }
        else {
            sidebar.removeClass('collapsed');
            sidebar.fadeIn(100);
            btn.fadeIn(100);
        }
       
    }
})(jQuery)