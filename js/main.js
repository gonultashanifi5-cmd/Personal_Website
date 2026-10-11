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
      description: `HTML and CSS are the fundamental building blocks of web development. Whether you're just starting your journey or looking to strengthen your fundamentals, understanding these technologies is absolutely crucial for success in web development.\n\nIn this comprehensive guide, we'll explore essential HTML structures that form the backbone of modern web pages. You'll learn about semantic HTML5 elements such as header, nav, main, article, and footer that improve both accessibility and SEO. These semantic elements make your code more meaningful and help search engines better understand your content.\n\nCSS fundamentals are equally important in modern web development. We'll dive deep into selectors, the cascade, specificity, and the box model - concepts that every web developer must master. Learn how to use Flexbox and CSS Grid for modern, responsive layouts, and understand responsive design principles that work seamlessly across all devices and screen sizes.\n\nBest practices for writing quality code include creating clean, maintainable code with meaningful class names, using CSS variables for consistency across your project, and leveraging browser DevTools for effective debugging. We'll also discuss performance optimization techniques such as minimizing CSS files and leveraging browser caching strategies.\n\nBy the end of this article, you'll have a solid, practical foundation to build upon as you advance your web development skills and tackle more complex projects.`
    },
    {
	image: '../image/image_2.jpg',
      title: 'Must-Have VS Code Extensions to Boost Your Productivity',
      date: 'November 12, 2025',
      author: 'Hanifi',
      comments: 8,
      description: `Visual Studio Code has become the industry-standard code editor for developers worldwide. Its true power lies in its extensive marketplace of extensions that can dramatically transform your workflow and development experience.\n\nEssential extensions for every developer include Prettier for automatic code formatting consistency, ESLint for comprehensive code quality checks, and GitLens for enhanced Git integration and version control visualization. These three extensions alone can significantly improve your productivity and overall code quality.\n\nFor frontend developers, extensions like Live Server provide instant browser refresh during development, Thunder Client or REST Client enable API testing without leaving the editor environment, and Emmet for HTML/CSS abbreviations speed up coding significantly through powerful shortcuts.\n\nDebuggers are absolutely crucial for development work. The Debugger for Chrome and Node.js extensions allow you to debug code directly within VS Code, avoiding the need to switch between applications. Thunder Client and REST Client save tremendous time when working with APIs and testing endpoints.\n\nTheming and personalization matter more than you might think. Customize your workspace with extensions like Peacock for workspace color coding, making it easy to visually identify which project you're currently working on at a glance.\n\nOther valuable extensions include Todo Tree for task management, Better Comments for organized and color-coded comments, and various language-specific extensions based on your technology stack. The key is finding extensions that match your workflow without overwhelming your editor with unnecessary bloat.`
    },
    {
	image: '../image/image_3.jpg',
      title: 'My Portfolio Design Process: From Concept to Reality',
      date: 'November 10, 2025',
      author: 'Hanifi',
      comments: 6,
      description: `Creating a professional portfolio website is one of the most important investments a developer can make. It's your digital showcase, your first impression to potential employers, clients, and the wider tech community.\n\nThe design process begins with clearly defining your goals and identifying your target audience. Are you showcasing projects to recruiters, attracting freelance clients, or demonstrating your design and development skills? Your answer shapes every design decision that follows in your project.\n\nI started by researching inspiration from portfolios I genuinely admired, identifying common patterns and elements that made them effective. Visual hierarchy, clear navigation, and fast loading times are non-negotiable requirements for a professional portfolio. Mobile responsiveness isn't optional - it's absolutely essential in today's mobile-first world.\n\nThe design phase involved creating detailed wireframes and prototypes before writing any code. I used Figma to visualize various layouts, test different color schemes, and ensure the user experience felt intuitive and professional. Color psychology played a significant role in my design decisions - I chose colors that conveyed professionalism while authentically reflecting my personal brand.\n\nTechnically, I built the site with modern HTML5, CSS3, and vanilla JavaScript, ensuring semantic markup for accessibility and proper SEO. Performance optimization included image compression, lazy loading of content, and minimizing CSS/JavaScript files to reduce load times.\n\nThe portfolio features a comprehensive project showcase with filtering capabilities, a blog section for sharing knowledge and insights, and a contact form for inquiries from potential clients. Each project includes detailed case studies explaining my development process, challenges overcome, and tangible results achieved.\n\nMaintenance is ongoing and essential. I regularly update project descriptions, add new work to keep it current, and refresh the design based on current industry trends and valuable feedback from visitors and peers.`
    },
    {
	image: '../image/frontend_blog.jpg',
      title: 'Frontend Development Tools: The Technologies Behind My Projects',
      date: 'November 8, 2025',
      author: 'Hanifi',
      comments: 4,
      description: `Frontend development has evolved dramatically over the past decade. The tools and technologies available today enable developers to build sophisticated, performant, and accessible applications that were previously unimaginable.\n\nAt the foundation are the core technologies: HTML5 for semantic structure, CSS3 for advanced styling and layouts, and JavaScript for rich interactivity. However, that's just the beginning of modern frontend development. The ecosystem now includes powerful frameworks and libraries that accelerate development.\n\nReact has become my preferred library for building complex interactive user interfaces. Its component-based architecture, efficient virtual DOM, and rich ecosystem make it ideal for sophisticated applications. For smaller projects requiring simplicity, Vue.js offers a gentle learning curve and elegant syntax.\n\nState management becomes crucial for larger applications. Redux and Context API help manage application state efficiently and predictably. For smaller projects, local component state often suffices and reduces complexity.\n\nBuild tools like Webpack, Vite, and Parcel have revolutionized how we develop and deploy applications. Vite's incredible developer experience with instant Hot Module Replacement makes development genuinely enjoyable. These tools enable automatic code splitting, tree-shaking, and optimization.\n\nCSS has evolved significantly in recent years. Tailwind CSS has transformed how I approach styling - the utility-first approach reduces CSS bloat significantly and improves long-term maintainability. SCSS/SASS provides powerful features including variables, mixins, nesting, and functions.\n\nTesting is non-negotiable in professional development. Jest for unit testing, React Testing Library for component testing, and Cypress or Playwright for end-to-end testing ensure code reliability and prevent regressions.\n\nFinally, version control with Git, code hosting on GitHub, and CI/CD pipelines automate testing and deployment, making collaborative development seamless and efficient.`
    },
    {
	image: '../image/akdeniz_unı.jpeg',
      title: 'Studying Computer Programming at Akdeniz University: My Ongoing Journey',
      date: 'November 6, 2025',
      author: 'Hanifi',
      comments: 7,
      description: `My experience in Akdeniz University's Computer Programming program has been genuinely transformative, and I'm proud to share that my studies continue to this day. This is far more than just an education - it's an ongoing comprehensive journey that continuously shapes my professional development and career trajectory.\n\nThe program's foundation begins with rigorous coursework in essential computer science fundamentals. Algorithms, data structures, discrete mathematics, and computational complexity theory provide the intellectual scaffolding upon which all modern software development rests. These courses demand rigorous mathematical thinking and problem-solving at a conceptual level.\n\nProgramming language instruction follows a deliberate and thoughtful progression. Beginning with C provides invaluable exposure to low-level concepts: memory management, pointers, and system-level programming. Advancing through Java, C++, Python, and web technologies offers multiple programming paradigms and diverse philosophical approaches to solving problems effectively.\n\nDatabase and SQL courses have been particularly enlightening and practical. Understanding relational database design, normalization principles, and query optimization proves immediately applicable to real-world development. Knowledge of database fundamentals prevents countless performance issues in production systems.\n\nWeb development modules proved especially transformative for my career direction. Learning HTML, CSS, and JavaScript opened my eyes to the dynamic frontend realm. Creating interactive interfaces and seeing ideas manifest visually in browsers provided powerful motivation to deepen my web development expertise and explore modern frameworks.\n\nGroup projects deserve special mention as invaluable learning experiences. These simulate authentic development environments where I managed version control with Git, navigated collaborative coding challenges, presented solutions to audiences, and learned communication skills crucial for team-based development.\n\nThe university actively fosters intellectual curiosity and innovation. I've attended technology seminars, explored emerging trends in artificial intelligence and machine learning, and benefited tremendously from professors who generously share real-world industry experience and professional mentorship.\n\nPeer collaboration at Akdeniz has proven invaluable. Studying alongside ambitious and talented classmates created an ecosystem of continuous learning and mutual support. We debug together, share resources, discuss architectural decisions thoughtfully, and celebrate breakthroughs as a community.\n\nMy studies continue actively today. I continue balancing advanced coursework with practical development projects, remaining committed to deepening my expertise in full-stack development, cloud technologies, and emerging frameworks. Each semester brings new challenges and rewarding opportunities to grow professionally.\n\nAkdeniz University has provided not just theoretical knowledge, but a supportive community, proven methodologies, and a professional culture that will undoubtedly define my entire career. The education here is comprehensive, rigorous, and - most importantly - still actively unfolding.`
    },
    {
	image: '../image/study_dev.jpg',
      title: 'Effective Study Techniques During Exam Season: My Strategy',
      date: 'November 4, 2025',
      author: 'Hanifi',
      comments: 5,
      description: `Exam season is undoubtedly intense, but with the right strategies and positive mindset, you can navigate it successfully while maintaining your overall wellbeing. Over the years, I've refined techniques that genuinely work and produce excellent results.\n\nTime management is absolutely foundational to exam preparation success. I create a detailed study schedule weeks before exams, allocating specific time blocks for each subject based on difficulty level and exam dates. This systematic approach prevents last-minute cramming and significantly reduces stress and anxiety.\n\nActive recall proves far more effective than passive reading. Instead of re-reading notes multiple times, I test myself using practice problems, flashcards, and mock exams. The Feynman Technique - explaining concepts in simple, clear terms - quickly reveals gaps in understanding.\n\nSpaced repetition optimizes long-term memory retention significantly. Rather than massing all study into one marathon session, I distribute practice intelligently over time. Reviewing material 1 day after learning, then 3 days later, then a week later creates robust long-term retention.\n\nBreaking complex material into manageable smaller chunks makes it digestible and less overwhelming. Instead of trying to learn an entire chapter at once, I master one focused section at a time, then integrate them progressively into a coherent whole.\n\nMinimizing distractions is absolutely non-negotiable during study sessions. I use website blockers, silence my phone, and study in dedicated quiet spaces. The Pomodoro Technique - 25-minute focused sessions with 5-minute breaks - maintains concentration effectively and prevents burnout.\n\nPhysical health directly supports mental performance and cognitive function. Regular exercise, quality sleep, and proper nutrition aren't luxuries during exam season - they're absolutely essential requirements. A tired or undernourished brain simply cannot absorb information effectively.\n\nFor subjects I struggle with, I actively form study groups. Explaining concepts to peers and hearing their explanations deepens understanding through dialogue. Group study also provides crucial motivation and emotional support during stressful periods.\n\nThe night before an exam, I review material lightly rather than cramming frantically. I ensure I'm well-rested because sleep consolidates memories and significantly improves cognitive function during the actual exam.\n\nFinalizing my approach means accepting that perfection is impossible - doing your genuine best with what you've learned is what truly matters and what matters most.`
    },
    {
	image: '../image/stratejilerim.webp',
      title: 'Why I Chose Software Development: My Personal Journey',
      date: 'November 2, 2025',
      author: 'Hanifi',
      comments: 9,
      description: `Choosing software development as my career path was undoubtedly one of the best decisions I've made. It wasn't a snap decision, however - it resulted from curiosity, experimentation, and gradual realization that this field aligned perfectly with my values and interests.\n\nMy interest in technology began genuinely early in my life. As a child, I was fascinated by how computers worked and wanted deeply to understand the logic behind software systems. This curiosity never faded; it only grew increasingly stronger over time.\n\nIn high school, I discovered programming through a computer science class that changed my perspective. Writing my first "Hello World" program felt genuinely magical - I had communicated with a machine in its language and it responded. That moment sparked something profound within me.\n\nWhat drew me most deeply to software development was the pure problem-solving aspect of the work. Every application solves real problems, makes people's lives tangibly better, or enables entirely new possibilities. This impact potential resonated strongly with my desire to contribute meaningfully to society.\n\nI genuinely appreciated the creativity involved in software development. It's not just about logic and syntax - it's about designing elegant solutions, creating intuitive user experiences, and building something entirely new that didn't exist before. This compelling blend of art and science appealed to me fundamentally.\n\nThe learning never stops in this field, which excites me greatly. Technology evolves constantly, and the industry genuinely rewards continuous learning and professional growth. As someone who loves learning deeply, this endless frontier excited me far more than settling into a static, unchanging career.\n\nThe developer community matters tremendously to me. Developers are generally collaborative and genuinely generous with sharing knowledge freely. Open-source contributions, mentorship, and knowledge sharing form the very foundation of how we grow collectively.\n\nPractically speaking, the field offers stability and abundant opportunities. Demand for skilled developers remains consistently high, career paths are genuinely diverse, and compensation reflects the real value we provide to organizations.\n\nUltimately, I chose this path because it allows me to solve problems creatively, create tangible value, learn continuously, and contribute to something genuinely larger than myself. That genuine alignment between my interests and my work is exactly why I'm so passionate about software development.`
    },
    {
	image: '../image/developer_pack.jpg',
      title: 'Best Web Developer Background Resource Sites: The Complete Guide',
      date: 'October 31, 2025',
      author: 'Hanifi',
      comments: 12,
      description: `Finding the perfect background images for web projects is absolutely crucial for creating visually appealing and professional websites. While paid services certainly exist, numerous high-quality free resources provide excellent options for developers and designers on any budget.\n\nUnsplash stands out prominently as a go-to platform offering thousands of high-resolution photographs completely free for both commercial and non-commercial use. The search functionality is excellent, and the community uploads new content regularly, keeping the resource fresh and current.\n\nPexels offers similar benefits - high-quality images, free for any purpose, with extensive collections covering nearly any topic you might need for your projects. Their careful curation keeps image quality consistently high and professional.\n\nPixabay combines photographs with illustrations, videos, and music effectively. This diversity makes it exceptionally valuable - you can find both realistic photos and artistic illustrations for different project requirements and design needs.\n\nPlaceholder services like Placeholder.com, PlaceholderImage, and Lorempixel are invaluable during development when final images aren't ready yet. These services generate placeholder images on-the-fly with specified dimensions to use during development.\n\nFor more artistic and abstract backgrounds, Abstract.com and Patterned.com provide unique options. These work wonderfully when you need something beyond standard photographs for creative projects.\n\nSpecialized platforms serve particular design needs effectively. For developers specifically, Gradient Backgrounds and Color Hunt provide beautiful gradients perfect for modern web designs and contemporary aesthetics.\n\nWhen using external images, remember to check usage rights carefully, provide proper attribution where required (even when not legally necessary, it's good practice), optimize images for web performance, and consider caching and CDN delivery for reliability.\n\nCompressing images with tools like TinyPNG or ImageOptim reduces file sizes significantly without sacrificing visual quality, which improves website performance considerably.\n\nImplementing lazy loading for background images ensures they load only when needed, further improving initial page load times and user experience metrics.\n\nUsing CSS backgrounds offers flexibility for responsive design, allowing different images on different screen sizes without requiring additional HTTP requests.\n\nThese free resources have become genuinely indispensable for my professional projects, enabling professional-looking websites without the budget for expensive original photography.`
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
    
    // Store current scroll position and prevent scroll
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    document.body.dataset.scrollY = scrollY;
    
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.classList.add('no-scroll');
    modal.classList.add('show');

    
  }

  // Close Blog Modal
  function closeBlogModal() {
    const modal = document.getElementById('blogModal');
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = 'auto';
      document.body.style.paddingRight = '0';
      document.body.classList.remove('no-scroll');
      
      // Restore scroll position
      const scrollY = document.body.dataset.scrollY || 0;
      window.scrollTo(0, parseInt(scrollY));
      delete document.body.dataset.scrollY;
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
    // Close modal when clicking on the modal background
    const modal = document.getElementById('blogModal');
    if (modal && e.target === modal) {
      closeBlogModal();
    }
  });

  // Close modal on ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeBlogModal();
    }
  });

})(jQuery);
