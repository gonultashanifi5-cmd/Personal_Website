// Tüm boş anchorlarda scroll'u tamamen engelle
$(document).on('click', 'a', function(e) {
	var href = $(this).attr('href');
	if (href === '#' || href === '' || href === 'javascript:void(0)') {
		e.preventDefault();
		e.stopPropagation();
		return false;
	}
});

AOS.init({
	duration: 200,
	easing: 'linear',
	once: true,
	throttleDelay: 200,
	disable: 'mobile'
});

(function($) {

	"use strict";

	// Stella parallax disabled for performance optimization
	// $(window).stellar({
    // responsive: true,
    // parallaxBackgrounds: true,
    // parallaxElements: true,
    // horizontalScrolling: false,
    // hideDistantElements: false,
    // scrollProperty: 'scroll'
  // });


	var fullHeight = function() {

		$('.js-fullheight').css('height', $(window).height());
		$(window).resize(function(){
			$('.js-fullheight').css('height', $(window).height());
		});

	};
	fullHeight();

	// loader
	var loader = function() {
		setTimeout(function() { 
			if($('#ftco-loader').length > 0) {
				$('#ftco-loader').removeClass('show');
			}
		}, 1);
	};
	loader();

	// Scrollax disabled for performance optimization
   // $.Scrollax();



   // Burger Menu
	var burgerMenu = function() {

		$('body').on('click', '.js-fh5co-nav-toggle', function(event){

			event.preventDefault();

			if ( $('#ftco-nav').is(':visible') ) {
				$(this).removeClass('active');
			} else {
				$(this).addClass('active');	
			}

			
			
		});

	};
	burgerMenu();


	var onePageClick = function() {


		$(document).on('click', '#ftco-nav a[href^="#"]', function (event) {
		// Sadece gerçekten sayfada bir id'ye sahip anchorlar için scroll yap
		var href = $.attr(this, 'href');
		if(href && href.length > 1 && $(href).length) {
			event.preventDefault();
			$('html, body').animate({
					scrollTop: $(href).offset().top - 70
			}, 500);
		}
		});

	};

	onePageClick();
	

	var carousel = function() {
		$('.home-slider').owlCarousel({
	    loop:true,
	    autoplay: true,
	    margin:0,
	    animateOut: 'fadeOut',
	    animateIn: 'fadeIn',
	    nav:false,
	    autoplayHoverPause: false,
	    items: 1,
	    navText : ["<span class='ion-md-arrow-back'></span>","<span class='ion-chevron-right'></span>"],
	    responsive:{
	      0:{
	        items:1
	      },
	      600:{
	        items:1
	      },
	      1000:{
	        items:1
	      }
	    }
		});
	};
	carousel();

	$('nav .dropdown').hover(function(){
		var $this = $(this);
		// 	 timer;
		// clearTimeout(timer);
		$this.addClass('show');
		$this.find('> a').attr('aria-expanded', true);
		// $this.find('.dropdown-menu').addClass('animated-fast fadeInUp show');
		$this.find('.dropdown-menu').addClass('show');
	}, function(){
		var $this = $(this);
			// timer;
		// timer = setTimeout(function(){
			$this.removeClass('show');
			$this.find('> a').attr('aria-expanded', false);
			// $this.find('.dropdown-menu').removeClass('animated-fast fadeInUp show');
			$this.find('.dropdown-menu').removeClass('show');
		// }, 100);
	});


	$('#dropdown04').on('show.bs.dropdown', function () {
	  console.log('show');
	});

	// scroll
	var scrollWindow = function() {
		$(window).scroll(function(){
			var $w = $(this),
					st = $w.scrollTop(),
					navbar = $('.ftco_navbar'),
					sd = $('.js-scroll-wrap');

			if (st > 150) {
				if ( !navbar.hasClass('scrolled') ) {
					navbar.addClass('scrolled');	
				}
			} 
			if (st < 150) {
				if ( navbar.hasClass('scrolled') ) {
					navbar.removeClass('scrolled sleep');
				}
			} 
			if ( st > 350 ) {
				if ( !navbar.hasClass('awake') ) {
					navbar.addClass('awake');	
				}
				
				if(sd.length > 0) {
					sd.addClass('sleep');
				}
			}
			if ( st < 350 ) {
				if ( navbar.hasClass('awake') ) {
					navbar.removeClass('awake');
					navbar.addClass('sleep');
				}
				if(sd.length > 0) {
					sd.removeClass('sleep');
				}
			}
		});
	};
	scrollWindow();

	

	var counter = function() {
		
		$('#section-counter, .hero-wrap, .ftco-counter, .ftco-about').waypoint( function( direction ) {

			if( direction === 'down' && !$(this.element).hasClass('ftco-animated') ) {

				var comma_separator_number_step = $.animateNumber.numberStepFactories.separator(',')
				$('.number').each(function(){
					var $this = $(this),
						num = $this.data('number');
						console.log(num);
					$this.animateNumber(
					  {
					    number: num,
					    numberStep: comma_separator_number_step
					  }, 7000
					);
				});
				
			}

		} , { offset: '95%' } );

	}
	counter();


	var contentWayPoint = function() {
		var i = 0;
		$('.ftco-animate').waypoint( function( direction ) {

			if( direction === 'down' && !$(this.element).hasClass('ftco-animated') ) {
				
				i++;

				$(this.element).addClass('item-animate');
				setTimeout(function(){

					$('body .ftco-animate.item-animate').each(function(k){
						var el = $(this);
						setTimeout( function () {
							var effect = el.data('animate-effect');
							if ( effect === 'fadeIn') {
								el.addClass('fadeIn ftco-animated');
							} else if ( effect === 'fadeInLeft') {
								el.addClass('fadeInLeft ftco-animated');
							} else if ( effect === 'fadeInRight') {
								el.addClass('fadeInRight ftco-animated');
							} else {
								el.addClass('fadeInUp ftco-animated');
							}
							el.removeClass('item-animate');
						},  k * 50, 'easeInOutExpo' );
					});
					
				}, 100);
				
			}

		} , { offset: '95%' } );
	};
	contentWayPoint();

	// magnific popup
	$('.image-popup').magnificPopup({
    type: 'image',
    closeOnContentClick: true,
    closeBtnInside: false,
    fixedContentPos: true,
    mainClass: 'mfp-no-margins mfp-with-zoom', // class to remove default margin from left and right side
     gallery: {
      enabled: true,
      navigateByImgClick: true,
      preload: [0,1] // Will preload 0 - before current, and 1 after the current image
    },
    image: {
      verticalFit: true
    },
    zoom: {
      enabled: true,
      duration: 300 // don't foget to change the duration also in CSS
    }
  });

  $('.popup-youtube, .popup-vimeo, .popup-gmaps').magnificPopup({
    disableOn: 700,
    type: 'iframe',
    mainClass: 'mfp-fade',
    removalDelay: 160,
    preloader: false,

    fixedContentPos: false
  });

  // ============= BLOG MODAL SYSTEM =============
  
  // Blog Modal Data
  const blogCardData = [
    {
	image: '../image/image_1.jpg',
      title: 'HTML & CSS Tips for Beginners: Essential Techniques to Get Started',
      date: 'November 14, 2025',
      author: 'Hanifi',
      comments: 5,
      description: `HTML and CSS are the building blocks of web development. Whether you're just starting your journey or looking to strengthen your fundamentals, understanding these languages is crucial.\n\nIn this comprehensive guide, we'll explore essential HTML structures that form the backbone of modern web pages. You'll learn about semantic HTML5 elements like <header>, <nav>, <main>, <article>, and <footer> that improve both accessibility and SEO.\n\nCSS fundamentals are equally important. We'll dive into selectors, the cascade, specificity, and the box model - concepts that every web developer must master. Learn how to use flexbox and CSS Grid for modern layouts, and understand responsive design principles that work across all devices.\n\nBest practices include writing clean, maintainable code with meaningful class names, using CSS variables for consistency, and leveraging browser DevTools for debugging. We'll also discuss performance optimization techniques like minimizing CSS and leveraging browser caching.\n\nBy the end of this article, you'll have a solid foundation to build upon as you advance your web development skills.`
    },
    {
	image: '../image/image_2.jpg',
      title: 'Must-Have VS Code Extensions to Boost Your Productivity',
      date: 'November 12, 2025',
      author: 'Hanifi',
      comments: 8,
      description: `Visual Studio Code has become the industry-standard code editor for developers worldwide. Its true power lies in its extensive marketplace of extensions that can transform your workflow.\n\nEssential extensions for every developer include Prettier for automatic code formatting, ESLint for code quality checks, and GitLens for enhanced Git integration. These three alone can dramatically improve your productivity and code quality.\n\nFor frontend developers, extensions like Live Server provide instant browser refresh, Thunder Client or REST Client enable API testing without leaving the editor, and Emmet for HTML/CSS abbreviations speed up coding significantly.\n\nDebuggers are crucial - the Debugger for Chrome and Node.js extensions allow you to debug code directly in VS Code. Thunder Client and REST Client save tremendous time when working with APIs.\n\nTheming and personalization matter too. Customize your workspace with extensions like Peacock for workspace color coding, making it easy to identify which project you're working on at a glance.\n\nOther valuable extensions include Todo Tree for task management, Better Comments for organized comments, and various language-specific extensions based on your tech stack. The key is finding extensions that match your workflow without overwhelming your editor with unnecessary bloat.`
    },
    {
	image: '../image/image_3.jpg',
      title: 'My Portfolio Design Process: From Concept to Reality',
      date: 'November 10, 2025',
      author: 'Hanifi',
      comments: 6,
      description: `Creating a professional portfolio website is one of the most important investments a developer can make. It's your digital showcase, your first impression to potential employers and clients.\n\nThe design process begins with defining your goals and target audience. Are you showcasing projects to recruiters, attracting freelance clients, or demonstrating your design skills? Your answer shapes every design decision that follows.\n\nI started by researching inspiration from portfolios I admired, identifying common patterns and what made them effective. Visual hierarchy, clear navigation, and fast loading times are non-negotiable requirements. Mobile responsiveness isn't optional - it's essential.\n\nThe design phase involved creating wireframes and prototypes before touching code. I used Figma to visualize layouts, test color schemes, and ensure the user experience felt intuitive. Color psychology played a significant role - I chose colors that conveyed professionalism while reflecting my personal brand.\n\nTechnically, I built the site with modern HTML5, CSS3, and JavaScript, ensuring semantic markup for accessibility. Performance optimization included image compression, lazy loading, and minimizing CSS/JavaScript files.\n\nThe portfolio features a project showcase with filtering, a blog section for sharing knowledge, and a contact form for inquiries. Each project includes detailed case studies explaining my process, challenges overcome, and results achieved.\n\nMaintenance is ongoing - I regularly update project descriptions, add new work, and refresh the design based on current trends and feedback. A portfolio is never truly finished; it evolves as you grow as a developer.`
    },
    {
	image: '../image/frontend_blog.jpg',
      title: 'Frontend Development Tools: The Technologies Behind My Projects',
      date: 'November 8, 2025',
      author: 'Hanifi',
      comments: 4,
      description: `Frontend development has evolved dramatically over the past decade. The tools and technologies available today enable developers to build sophisticated, performant, and accessible applications that were unimaginable years ago.\n\nAt the foundation are the core technologies: HTML5 for structure, CSS3 for styling, and JavaScript for interactivity. But that's just the beginning. Modern frontend development relies on a rich ecosystem of frameworks and libraries.\n\nReact has become my go-to library for building interactive user interfaces. Its component-based architecture, virtual DOM, and rich ecosystem make it perfect for complex applications. When I need something simpler, I consider Vue.js for its gentle learning curve and elegant syntax.\n\nState management is crucial for larger applications. Redux and Context API help manage application state efficiently. For smaller projects, local component state often suffices.\n\nBuild tools like Webpack, Vite, and Parcel have revolutionized how we develop and deploy. Vite's incredible developer experience with instant Hot Module Replacement makes development a joy. These tools enable code splitting, tree-shaking, and optimization automatically.\n\nCSS has evolved too. Tailwind CSS has transformed how I write styles - utility-first approach reduces CSS bloat and improves maintainability. SCSS/SASS provides powerful features like variables, mixins, and nesting.\n\nTesting is non-negotiable. Jest for unit testing, React Testing Library for component testing, and Cypress or Playwright for end-to-end testing ensure code reliability.\n\nFinally, version control with Git, code hosting on GitHub, and CI/CD pipelines automate testing and deployment, making collaborative development seamless.`
    },
    {
	image: '../image/akdeniz_unı.jpeg',
      title: 'Studying Computer Programming at Akdeniz University: My Experience',
      date: 'November 6, 2025',
      author: 'Hanifi',
      comments: 7,
      description: `My journey through Akdeniz University's Computer Engineering program was transformative. Beyond the curriculum, the experience shaped my approach to problem-solving and collaboration.\n\nThe program started with fundamental computer science concepts - algorithms, data structures, and discrete mathematics. These foundations, though challenging at times, proved invaluable for understanding how software systems work at their core.\n\nLanguage instruction began with C, teaching low-level programming concepts and memory management. Later courses covered Java, C++, and Python, each offering unique perspectives on programming paradigms. This polyglot approach expanded my thinking beyond syntax.\n\nCourses on databases and SQL were particularly enlightening. Understanding relational databases, normalization, and query optimization proved essential for real-world application development.\n\nWeb development courses introduced HTML, CSS, and JavaScript. I was captivated - the immediate visual feedback and ability to see my code come to life in a browser motivated me to deepen my frontend expertise.\n\nBeyond coursework, I participated in group projects that simulated real development environments. Collaborating with teammates, managing Git repositories, and presenting solutions taught lessons no classroom could provide.\n\nThe university environment encouraged research and innovation. I explored emerging technologies, attended tech talks, and connected with professors who shared their industry experience.\n\nOne of the most valuable aspects was the peer community. Studying with ambitious classmates created an environment of continuous learning. We helped each other debug code, shared resources, and celebrated each other's successes.\n\nWhile not every course was equally interesting, the comprehensive education provided a strong foundation for my career in software development.`
    },
    {
	image: '../image/study_dev.jpg',
      title: 'Effective Study Techniques During Exam Season: My Strategy',
      date: 'November 4, 2025',
      author: 'Hanifi',
      comments: 5,
      description: `Exam season is intense, but with the right strategies and mindset, you can navigate it successfully while maintaining your wellbeing. Over the years, I've refined techniques that truly work.\n\nTime management is foundational. I create a detailed study schedule weeks before exams, allocating specific time blocks for each subject based on difficulty and exam date. This prevents last-minute cramming and reduces stress significantly.\n\nActive recall is more effective than passive reading. Instead of re-reading notes, I test myself using practice problems, flashcards, and mock exams. The Feynman Technique - explaining concepts in simple terms - reveals gaps in understanding quickly.\n\nSpaced repetition optimizes memory retention. Rather than massing all study into one session, I distribute practice over time. Reviewing material 1 day after learning, then 3 days, then a week later, creates long-term retention.\n\nBreaking complex material into smaller chunks makes it digestible. Instead of trying to learn an entire chapter, I master one section at a time, then integrate them progressively.\n\nMinimizing distractions is non-negotiable. I use website blockers, silence my phone, and study in dedicated spaces. The Pomodoro Technique - 25-minute focused sessions with 5-minute breaks - maintains concentration.\n\nPhysical health supports mental performance. Regular exercise, quality sleep, and proper nutrition aren't luxuries during exam season - they're essential. A tired brain can't absorb information effectively.\n\nFor subjects I struggle with, I form study groups. Explaining concepts to peers and hearing their explanations deepens understanding. Group study also provides motivation and emotional support.\n\nThe night before an exam, I review lightly rather than cramming. I ensure I'm well-rested because sleep consolidates memories and improves cognitive function during the exam.\n\nFinalizing my approach means accepting that perfection isn't possible - doing your best with what you've learned is what matters.`
    },
    {
	image: '../image/stratejilerim.webp',
      title: 'Why I Chose Software Development: My Personal Journey',
      date: 'November 2, 2025',
      author: 'Hanifi',
      comments: 9,
      description: `Choosing software development as my career path was one of the best decisions I've made. It wasn't a snap decision though - it was the result of curiosity, experimentation, and gradual realization that this field aligned with my values and interests.\n\nMy interest in technology began early. As a child, I was fascinated by how computers worked and wanted to understand the logic behind software. This curiosity never faded; it only grew stronger.\n\nIn high school, I discovered programming through a computer science class. Writing my first "Hello World" program felt magical - I had communicated with a machine in its language and it responded. That moment sparked something.\n\nWhat drew me most deeply to software development was the problem-solving aspect. Every application solves real problems, makes people's lives better, or enables new possibilities. The impact potential resonated with my desire to contribute meaningfully.\n\nI appreciated the creativity involved. Software development isn't just about logic and syntax - it's about designing elegant solutions, creating intuitive user experiences, and building something that didn't exist before. This blend of art and science appealed to me.\n\nThe learning never stops. Technology evolves constantly, and the industry rewards continuous learning and growth. As someone who loves learning, this endless frontier excited me more than settling into a static career.\n\nThe community matters too. Developers are generally collaborative and generous with knowledge. Open-source contributions, mentorship, and knowledge sharing form the foundation of how we grow together. This supportive culture appealed to me.\n\nPractically, the field offers stability and opportunities. Demand for skilled developers remains high, career paths are diverse, and compensation reflects the value we provide.\n\nUltimately, I chose this path because it allowed me to solve problems, create value, learn continuously, and contribute to something larger than myself. That alignment between my interests and my work is why I'm passionate about software development.`
    },
    {
	image: '../image/developer_pack.jpg',
      title: 'Best Web Developer Background Resource Sites: The Complete Guide',
      date: 'October 31, 2025',
      author: 'Hanifi',
      comments: 12,
      description: `Finding the perfect background images for web projects is crucial for creating visually appealing websites. While paid services exist, numerous high-quality free resources provide excellent options for developers and designers.\n\nUnsplash stands out as a go-to platform offering thousands of high-resolution photographs completely free for commercial and non-commercial use. The search functionality is excellent, and the community uploads regularly, keeping content fresh.\n\nPexels offers similar benefits - high-quality images, free for any purpose, with extensive collections covering nearly any topic you'd need. Their curation keeps image quality consistently high.\n\nPixabay combines photographs with illustrations, videos, and music. The diversity makes it valuable - you can find both realistic photos and artistic illustrations for different project needs.\n\nPlaceholder services like Placeholder.com, PlaceholderImage, and Lorempixel are invaluable during development when final images aren't ready. These generate images on-the-fly with specified dimensions.\n\nFor more artistic, abstract backgrounds, Abstract.com and Patterned.com provide unique options. These work well when you need something beyond standard photographs.\n\nSpecialized platforms serve particular needs. For developers, Gradient Backgrounds and Blend provides beautiful gradients perfect for modern designs.\n\nWhen using external images, remember to: check usage rights, give attribution where required (even if not legally necessary, it's good practice), optimize images for web performance, and consider caching and CDN delivery for reliability.\n\nCompressing images with tools like TinyPNG or ImageOptim reduces file sizes without sacrificing quality, improving website performance.\n\nLazyloading background images ensures they load only when needed, further improving initial page load times.\n\nUsing CSS backgrounds offers flexibility for responsive design, allowing different images on different screen sizes without additional HTTP requests.\n\nThese resources have become indispensable for my projects, enabling professional-looking websites without the budget for original photography.`
    }
  ];

  // Open Blog Modal
  function openBlogModal(e) {
    const card = e.target.closest('.blog-entry');
    if (!card) return;
    
    const index = parseInt(card.getAttribute('data-index'));
    if (isNaN(index) || !blogCardData[index]) return;
    
    const data = blogCardData[index];
    const modal = document.getElementById('blogModal');
    
    if (!modal) return;
    
    // Set modal content
    const modalImg = modal.querySelector('.blog-modal-image');
    const modalTitle = modal.querySelector('.blog-modal-title');
    const modalMeta = modal.querySelector('.blog-modal-meta');
    const modalDesc = modal.querySelector('.blog-modal-description');
    
    if (modalImg) modalImg.src = data.image;
    if (modalTitle) modalTitle.textContent = data.title;
    
    if (modalMeta) {
      modalMeta.innerHTML = `
        <span>📅 ${data.date}</span>
        <span>✍️ ${data.author}</span>
        <span>💬 ${data.comments} Comments</span>
      `;
    }
    
    if (modalDesc) {
      const descHTML = data.description
        .split('\n')
        .filter(line => line.trim())
        .map(p => `<p>${p.trim()}</p>`)
        .join('');
      modalDesc.innerHTML = descHTML;
    }
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  // Close Blog Modal
  function closeBlogModal() {
    const modal = document.getElementById('blogModal');
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = 'auto';
    }
  }

  // Blog Modal Event Listeners
  document.addEventListener('click', function(e) {
    if (e.target.closest('.blog-card-btn')) {
      openBlogModal(e);
    }
    if (e.target.closest('.blog-modal-close')) {
      closeBlogModal();
    }
  });

  // Close modal on ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeBlogModal();
    }
  });

  // Close modal when clicking outside
  const modal = document.getElementById('blogModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        closeBlogModal();
      }
    });
  }

})(jQuery);
