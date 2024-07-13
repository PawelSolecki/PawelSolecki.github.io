function changeSlider(type) {
  const slider = document.getElementById("slider");
  slider.innerHTML = ""; // Clear existing images

  let images = [];

  if (type === "tshirt") {
    images = [
      "tshirt.jpeg",
      "tshirt.jpeg",
      "tshirt.jpeg",
      "tshirt.jpeg",
      "tshirt.jpeg",
      "tshirt.jpeg",
      "tshirt.jpeg",
      "tshirt.jpeg",
    ];
  } else if (type === "trousers") {
    images = ["dres.jpeg", "dres.jpeg", "dres.jpeg", "dres.jpeg", "dres.jpeg"];
  } else if (type === "shoes") {
    images = ["buty.jpeg", "buty.jpeg", "buty.jpeg", "buty.jpeg", "buty.jpeg"];
  }

  images.forEach((src) => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = type;
    slider.appendChild(img);
  });
}

// Initial load
changeSlider("tshirt");
