// Pincode Details Logic
const urlParams = new URLSearchParams(window.location.search);
const poName = urlParams.get('name');
const pincode = urlParams.get('pincode');

const elements = {
    breadcrumbName: document.getElementById('breadcrumb-name'),
    loading: document.getElementById('loading-details'),
    error: document.getElementById('error-details'),
    content: document.getElementById('content-details'),
    name: document.getElementById('detail-name'),
    pincode: document.getElementById('detail-pincode'),
    delivery: document.getElementById('detail-delivery-status'),
    district: document.getElementById('detail-district'),
    state: document.getElementById('detail-state'),
    region: document.getElementById('detail-region'),
    division: document.getElementById('detail-division'),
    circle: document.getElementById('detail-circle'),
    type: document.getElementById('detail-branch-type'),
    copyBtn: document.getElementById('copy-summary-btn')
};

const fetchDetails = async () => {
    if (!pincode || !poName) {
        showError();
        return;
    }

    try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        if (!response.ok) throw new Error('API failed');

        const data = await response.json();
        if (data[0].Status !== "Success") throw new Error('No results');

        const poDetail = data[0].PostOffice.find(po => po.Name === poName);
        if (!poDetail) throw new Error('Post office not found');

        renderDetails(poDetail);
    } catch (error) {
        console.error('Error fetching details:', error);
        showError();
    }
};

const renderDetails = (po) => {
    elements.loading.classList.add('hidden');
    elements.content.classList.remove('hidden');

    elements.breadcrumbName.textContent = po.Name;
    elements.name.textContent = po.Name;
    elements.pincode.textContent = po.Pincode;
    elements.delivery.textContent = po.DeliveryStatus;
    elements.district.textContent = po.District;
    elements.state.textContent = po.State;
    elements.region.textContent = po.Region;
    elements.division.textContent = po.Division;
    elements.circle.textContent = po.Circle;
    elements.type.textContent = po.BranchType;

    // Head tag updates for SEO
    document.title = `${po.Name} Pincode ${po.Pincode} Details - Pirates Droid`;

    // Copy functionality
    elements.copyBtn.addEventListener('click', () => {
        const summary = `${po.Name} Post Office, Pincode: ${po.Pincode}, District: ${po.District}, State: ${po.State}`;
        navigator.clipboard.writeText(summary).then(() => {
            const originalText = elements.copyBtn.innerHTML;
            elements.copyBtn.innerHTML = '<i data-lucide="check" class="h-5 w-5 text-green-500"></i> Copied Address!';
            if (window.lucide) window.lucide.createIcons();
            setTimeout(() => {
                elements.copyBtn.innerHTML = originalText;
                if (window.lucide) window.lucide.createIcons();
            }, 2000);
        });
    });

    if (window.lucide) window.lucide.createIcons();
};

const showError = () => {
    elements.loading.classList.add('hidden');
    elements.error.classList.remove('hidden');
};

// Start fetching
fetchDetails();
