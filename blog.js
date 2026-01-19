import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

// Your web app's Firebase configuration
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Mock Data for the hardcoded blogs in blogs.html
const mockBlogData = {

    "hill-stations": {
        title: "10 Best Hill Stations in India for Summer Escape",
        category: "Travel Tips",
        author: "Swapnali Kambli",
        readTime: "6 min read",
        date: "February 20, 2024",
        thumb: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        tags: ["Hill Stations", "Summer", "Nature"],
        content: `
            <p>When the summer heat becomes unbearable, the serene hill stations of India offer a much-needed respite. From the snow-capped peaks of the Himalayas to the lush tea gardens of the Nilgiris, here's our pick of the best escapes.</p>

            <h2>1. Shimla, Himachal Pradesh</h2>
            <p>Known as the 'Queen of Hills', Shimla remains a classic favorite with its colonial architecture and pleasant Mall Road.</p>

            <h2>2. Munnar, Kerala</h2>
            <p>Wide expanses of tea plantations and mist-covered valleys make Munnar a romantic paradise.</p>

            <h2>3. Manali, Himachal Pradesh</h2>
            <p>For adventure enthusiasts, Manali offers trekking, paragliding, and a gateway to the stunning Rohtang Pass.</p>

            <p>Explore more destinations in our full guide, including Ooty, Mussoorie, and Darjeeling. Pack your bags and get ready for the mountains!</p>
        `
    },
    "kerala-backwaters": {
        title: "Kerala Backwaters: A Complete Travel Guide",
        category: "Destination Guide",
        author: "Meera Nair",
        readTime: "7 min read",
        date: "March 5, 2024",
        thumb: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        tags: ["Kerala", "Backwaters", "Houseboat"],
        content: `
            <p>The Kerala backwaters are a network of brackish lagoons and lakes lying parallel to the Arabian Sea coast. A journey through these tranquil waters is an experience of a lifetime.</p>

            <h2>Houseboat Stays</h2>
            <p>Staying on a traditional 'Kettuvallam' (houseboat) is the iconic way to see the backwaters. Enjoy freshly cooked local meals as you drift slowly past coconut groves and paddy fields.</p>

            <h2>Alappuzha (Alleppey)</h2>
            <p>Often called the 'Venice of the East', Alleppey is the hub for backwater cruises and the venue for the famous Nehru Trophy Boat Race.</p>

            <p>Discover the best time to visit, how to book your houseboat, and the must-try local dishes in our comprehensive guide.</p>
        `
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const blogId = urlParams.get('id');

    if (!blogId) {
        window.location.href = 'blogs.html';
        return;
    }

    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function () {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Close mobile menu when clicking on a link
    const mobileMenuLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', function () {
            if (mobileMenu) {
                mobileMenu.classList.add('hidden');
            }
        });
    });

    // Try to load from mock data first
    if (mockBlogData[blogId]) {
        renderBlog(mockBlogData[blogId]);
    } else {
        // Fallback or Try Firebase (if there's a blog node)
        loadBlogFromFirebase(blogId);
    }

    // Initialize Lucide icons
    lucide.createIcons();
});

function renderBlog(data) {
    document.title = `${data.title} - Pirates Droid`;
    document.getElementById('blog-hero-image').style.backgroundImage = `url('${data.thumb}')`;
    document.getElementById('blog-category').textContent = data.category;
    document.getElementById('blog-title').textContent = data.title;
    document.getElementById('blog-author').innerHTML += data.author;
    document.getElementById('blog-read-time').innerHTML += data.readTime;
    document.getElementById('blog-date').innerHTML += data.date;
    document.getElementById('blog-content').innerHTML = data.content;

    const tagsContainer = document.getElementById('blog-tags');
    tagsContainer.innerHTML = '';
    data.tags.forEach(tag => {
        const span = document.createElement('span');
        span.className = 'px-4 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 cursor-pointer transition-colors';
        span.textContent = tag;
        tagsContainer.appendChild(span);
    });

    // Render recommendations (just some other random blogs)
    renderRecommendations(data.title);
}

function loadBlogFromFirebase(id) {
    const blogRef = ref(database, `/Blogs/${id}`);
    onValue(blogRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            renderBlog({
                title: data.Title || "Untitled",
                category: data.Category || "Travel",
                author: data.Author || "Pirates Droid",
                readTime: data.ReadTime || "5 min read",
                date: data.Date || new Date().toLocaleDateString(),
                thumb: data.Thumb || "https://images.unsplash.com/photo-1599661046827-dacde645ed05",
                tags: data.Tags ? data.Tags.split(',') : ["Travel"],
                content: data.Content || "<p>No content available.</p>"
            });
        } else {
            // If not found in Firebase and not in mock, show error
            document.getElementById('blog-content').innerHTML = `
                <div class="text-center py-20">
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h2>
                    <p class="text-gray-600 mb-8">The blog article you're looking for doesn't exist or has been moved.</p>
                    <a href="blogs.html" class="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors">Back to Blogs</a>
                </div>
             `;
        }
    });
}

function renderRecommendations(currentTitle) {
    const recContainer = document.getElementById('recommended-blogs');
    recContainer.innerHTML = '';

    const otherBlogs = Object.keys(mockBlogData)
        .filter(key => mockBlogData[key].title !== currentTitle)
        .slice(0, 3);

    otherBlogs.forEach(key => {
        const blog = mockBlogData[key];
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer';
        card.onclick = () => window.location.href = `blog.html?id=${key}`;

        card.innerHTML = `
            <img src="${blog.thumb}" alt="${blog.title}" class="w-full h-48 object-cover">
            <div class="p-6">
                <p class="text-xs font-semibold text-orange-400 mb-2 uppercase">${blog.category}</p>
                <h3 class="text-lg font-bold text-gray-900 mb-3 line-clamp-2">${blog.title}</h3>
                <div class="flex justify-between items-center text-xs text-gray-500">
                    <span>${blog.author}</span>
                    <span>${blog.readTime}</span>
                </div>
            </div>
        `;
        recContainer.appendChild(card);
    });
}
