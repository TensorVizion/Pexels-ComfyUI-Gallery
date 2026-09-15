# Pexels ComfyUI Gallery 🖼️

A custom node for [ComfyUI](https://github.com/comfyanonymous/ComfyUI) that integrates the [Pexels API](https://www.pexels.com/api/), allowing you to search, browse, and load high-quality, royalty-free stock images directly into your generative AI workflows. 

Perfect for quickly finding reference images, Image2Image base layers, or ControlNet inputs without ever leaving the ComfyUI interface.

## ✨ Features

* **Direct Integration:** Search and fetch images from Pexels straight into your ComfyUI workspace.
* **Customizable Searches:** Filter by search query, orientation, and image size to get the exact reference you need.
* **Seamless Workflow:** Outputs standard `IMAGE` format ready to be wired into VAE Encodes, ControlNets, IP-Adapters, and more.

## 📦 Installation

### Option 1: Via ComfyUI Manager (Recommended)
1. Open the **ComfyUI Manager**.
2. Click **Install Custom Nodes**.
3. Search for `Pexels-ComfyUI-Gallery`.
4. Click Install and restart ComfyUI.

### Option 2: Manual Installation
1. Open your terminal and navigate to your ComfyUI `custom_nodes` directory:
   ```bash
   cd ComfyUI/custom_nodes

