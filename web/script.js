import { app } from "../../scripts/app.js";

app.registerExtension({
    name: "Comfy.PexelsGallery",
    
    // 1. Updated global canvas drop handler (now async)
    async setup() {
        const canvasEl = document.getElementById("graph-canvas");
        if (!canvasEl) return;

        canvasEl.addEventListener("drop", async (e) => {
            const pexelsUrl = e.dataTransfer.getData("pexels_url");
            if (pexelsUrl) {
                e.preventDefault();
                e.stopPropagation();

                // 2. Calculate drop position (same as before)
                const rect = canvasEl.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const pos = [ 
                    (x - app.canvas.ds.offset[0]) / app.canvas.ds.scale,
                    (y - app.canvas.ds.offset[1]) / app.canvas.ds.scale
                ];

                // 3. Spawn a standard LoadImage node
                const newNode = LiteGraph.createNode("LoadImage");
                newNode.pos = pos;
                app.graph.add(newNode);
                
                // Show a loading text or indication on the node.
                newNode.title = "Pexels: Saving image...";

                try {
                    // 4. Call server API to download and save the image locally
                    const response = await fetch("/pexels/save_image", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ url: pexelsUrl }),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const filename = data.filename;

                        // 5. Update the node's 'image' widget to point to the local file
                        const imageWidget = newNode.widgets.find(w => w.name === "image");
                        if (imageWidget) {
                            imageWidget.value = filename;
                            app.graph.setDirtyCanvas(true);
                        }
                        
                        // Set the title back and let ComfyUI handle the image preview.
                        newNode.title = "Pexels Image";
                        // Re-trigger the node's input change callback, which
                        // prompts ComfyUI to reload the image preview.
                        imageWidget.callback(filename);

                        console.log(`Saved Pexels image as: ${filename}`);
                    } else {
                        const errorData = await response.json();
                        console.error("Failed to save Pexels image:", errorData.error);
                        newNode.title = "Save Error!";
                    }
                } catch (error) {
                    console.error("Error during Pexels save_image call:", error);
                    newNode.title = "Connection Error!";
                }
            }
        });
    },

    // (This part remains the same) - beforeRegisterNodeDef
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "PexelsImageSearch") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            
            nodeType.prototype.onNodeCreated = function () {
                const r = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;
                const node = this;

                const container = document.createElement("div");
                Object.assign(container.style, {
                    width: "100%", height: "500px", overflowY: "scroll",
                    display: "grid", gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "4px", background: "#1e1e1e", padding: "6px",
                    boxSizing: "border-box", borderRadius: "4px", marginTop: "10px"
                });

                const searchBtn = document.createElement("button");
                searchBtn.textContent = "🖼️ Load Gallery";
                Object.assign(searchBtn.style, {
                    width: "100%", padding: "8px", cursor: "pointer",
                    background: "#353535", color: "white", border: "1px solid #555",
                    borderRadius: "4px", marginTop: "5px", fontWeight: "bold"
                });

                node.addDOMWidget("search_btn", "btn", searchBtn);
                node.addDOMWidget("gallery", "div", container);

                searchBtn.onclick = async () => {
                    container.innerHTML = "<p style='color:#888; grid-column:span 2; text-align:center;'>Loading...</p>";
                    
                    const apiKeyWidget = node.widgets.find(w => w.name === "api_key");
                    const queryWidget = node.widgets.find(w => w.name === "search_query");
                    if (!apiKeyWidget || !queryWidget) return;

                    try {
                        const url = `/pexels/search?query=${encodeURIComponent(queryWidget.value)}&api_key=${encodeURIComponent(apiKeyWidget.value)}`;
                        const resp = await fetch(url);
                        const data = await resp.json();
                        
                        container.innerHTML = ""; 
                        
                        if (data.photos && data.photos.length > 0) {
                            data.photos.forEach(photo => {
                                const img = document.createElement("img");
                                img.src = photo.src.small;
                                
                                img.draggable = true;
                                img.ondragstart = (e) => {
                                    e.stopPropagation(); // Prevent moving the parent node
                                    e.dataTransfer.setData("pexels_url", photo.src.original);
                                    // We no longer need to pass the API key on drop,
                                    // since the server handles the save.
                                    e.dataTransfer.effectAllowed = "copy";
                                };

                                Object.assign(img.style, {
                                    width: "100%", height: "160px", objectFit: "contain", background: "#000",
                                    cursor: "grab", borderRadius: "4px", boxSizing: "border-box"
                                });
                                
                                img.onclick = () => {
                                    const urlWidget = node.widgets.find(w => w.name === "selected_url");
                                    if (urlWidget) {
                                        urlWidget.value = photo.src.original;
                                        app.graph.setDirtyCanvas(true);
                                        container.childNodes.forEach(c => c.style.border = "none");
                                        img.style.border = "3px solid #4CAF50";
                                    }
                                };
                                container.appendChild(img);
                            });
                        } else {
                            container.innerHTML = "<p style='color:#ff5555; grid-column:span 2; font-size:12px;'>No images found.</p>";
                        }
                    } catch (e) {
                        container.innerHTML = "<p style='color:#ff5555; grid-column:span 2; font-size:12px;'>Connection Error.</p>";
                    }
                };

                node.setSize([380, 800]);
                return r;
            };
        }
    }
});