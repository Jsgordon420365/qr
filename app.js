class ObjectTracker {
    constructor() {
        this.cameras = [];
        this.currentCamera = null;
        this.video = null;
        this.canvas = null;
        this.ctx = null;
        this.qrScanner = null;
        this.isTracking = false;
        this.isQRScanning = false;
        
        // Data storage
        this.detectedObjects = new Map();
        this.detectedQRCodes = new Map();
        this.associations = new Map();
        
        // Session tracking
        this.sessionStart = null;
        this.objectCounter = 0;
        this.qrCounter = 0;
        this.associationCounter = 0;
        
        // Performance tracking
        this.frameCount = 0;
        this.lastFPSUpdate = Date.now();
        this.fps = 0;
        
        this.init();
    }
    
    async init() {
        this.setupDOM();
        await this.getCameraDevices();
        this.setupEventListeners();
        this.updateStats();
        this.startSessionTimer();
    }
    
    setupDOM() {
        // Get DOM elements
        this.video = document.getElementById('camera-feed');
        this.canvas = document.getElementById('overlay-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.cameraSelect = document.getElementById('camera-select');
        this.cameraPlaceholder = document.getElementById('camera-placeholder');
        
        // Status elements
        this.cameraStatus = document.getElementById('camera-status');
        this.qrStatus = document.getElementById('qr-status');
        this.trackingStatus = document.getElementById('tracking-status');
        
        // List elements
        this.qrList = document.getElementById('qr-list');
        this.objectList = document.getElementById('object-list');
        this.associationList = document.getElementById('association-list');
        
        // Stat elements
        this.sessionDuration = document.getElementById('session-duration');
        this.objectsCount = document.getElementById('objects-count');
        this.qrCount = document.getElementById('qr-count');
        this.associationsCount = document.getElementById('associations-count');
        this.fpsCounter = document.getElementById('fps-counter');
    }
    
    async getCameraDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.cameras = devices.filter(device => device.kind === 'videoinput');
            
            this.cameraSelect.innerHTML = '<option value="">Select Camera</option>';
            this.cameras.forEach((camera, index) => {
                const option = document.createElement('option');
                option.value = camera.deviceId;
                option.textContent = camera.label || `Camera ${index + 1}`;
                this.cameraSelect.appendChild(option);
            });
            
            if (this.cameras.length === 0) {
                this.showError('No cameras found');
            }
        } catch (error) {
            this.showError('Failed to enumerate camera devices: ' + error.message);
        }
    }
    
    setupEventListeners() {
        // Camera controls
        document.getElementById('start-camera').addEventListener('click', () => this.startCamera());
        document.getElementById('stop-camera').addEventListener('click', () => this.stopCamera());
        document.getElementById('start-tracking').addEventListener('click', () => this.startTracking());
        
        // QR controls
        document.getElementById('start-qr-scan').addEventListener('click', () => this.startQRScanning());
        document.getElementById('stop-qr-scan').addEventListener('click', () => this.stopQRScanning());
        
        // Session controls
        document.getElementById('export-data').addEventListener('click', () => this.exportData());
        document.getElementById('clear-session').addEventListener('click', () => this.clearSession());
        
        // Association controls
        document.getElementById('create-association').addEventListener('click', () => this.showAssociationModal());
        document.getElementById('save-association').addEventListener('click', () => this.saveAssociation());
        
        // Modal controls
        document.querySelector('.modal-close').addEventListener('click', () => this.hideAssociationModal());
        document.querySelector('.modal-cancel').addEventListener('click', () => this.hideAssociationModal());
        document.querySelector('.modal-backdrop').addEventListener('click', () => this.hideAssociationModal());
        
        // Video click for object selection
        this.video.addEventListener('click', (e) => this.handleVideoClick(e));
        
        // Resize handler
        window.addEventListener('resize', () => this.handleResize());
    }
    
    async startCamera() {
        try {
            const selectedCamera = this.cameraSelect.value;
            if (!selectedCamera) {
                this.showError('Please select a camera device');
                return;
            }
            
            const constraints = {
                video: {
                    deviceId: { exact: selectedCamera },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = stream;
            this.currentCamera = stream;
            
            await new Promise((resolve) => {
                this.video.onloadedmetadata = resolve;
            });
            
            this.setupCanvas();
            this.showVideo();
            this.updateCameraStatus('Connected', 'success');
            
            // Enable controls
            document.getElementById('start-camera').disabled = true;
            document.getElementById('stop-camera').disabled = false;
            document.getElementById('start-tracking').disabled = false;
            document.getElementById('start-qr-scan').disabled = false;
            
            this.showSuccess('Camera started successfully');
        } catch (error) {
            this.showError('Failed to start camera: ' + error.message);
            this.updateCameraStatus('Failed', 'error');
        }
    }
    
    stopCamera() {
        if (this.currentCamera) {
            const tracks = this.currentCamera.getTracks();
            tracks.forEach(track => track.stop());
            this.currentCamera = null;
        }
        
        this.stopQRScanning();
        this.stopTracking();
        this.hideVideo();
        this.updateCameraStatus('Disconnected', 'info');
        
        // Reset controls
        document.getElementById('start-camera').disabled = false;
        document.getElementById('stop-camera').disabled = true;
        document.getElementById('start-tracking').disabled = true;
        document.getElementById('start-qr-scan').disabled = true;
        document.getElementById('stop-qr-scan').disabled = true;
    }
    
    setupCanvas() {
        const rect = this.video.getBoundingClientRect();
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
    }
    
    showVideo() {
        this.cameraPlaceholder.classList.add('hidden');
        this.video.classList.add('active');
    }
    
    hideVideo() {
        this.cameraPlaceholder.classList.remove('hidden');
        this.video.classList.remove('active');
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    handleResize() {
        if (this.video.srcObject) {
            this.setupCanvas();
        }
    }
    
    startTracking() {
        if (!this.currentCamera) {
            this.showError('Camera must be started first');
            return;
        }
        
        this.isTracking = true;
        this.updateTrackingStatus('Active', 'success');
        this.startTrackingLoop();
        this.showSuccess('Object tracking started. Click on objects to track them.');
    }
    
    stopTracking() {
        this.isTracking = false;
        this.updateTrackingStatus('Inactive', 'info');
    }
    
    startTrackingLoop() {
        if (!this.isTracking) return;
        
        this.updateFPS();
        this.drawOverlays();
        
        requestAnimationFrame(() => this.startTrackingLoop());
    }
    
    updateFPS() {
        this.frameCount++;
        const now = Date.now();
        
        if (now - this.lastFPSUpdate >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFPSUpdate));
            this.fpsCounter.textContent = `FPS: ${this.fps}`;
            this.frameCount = 0;
            this.lastFPSUpdate = now;
        }
    }
    
    drawOverlays() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw object bounding boxes
        this.detectedObjects.forEach((obj) => {
            this.drawObjectBox(obj);
        });
        
        // Draw QR code boxes
        this.detectedQRCodes.forEach((qr) => {
            this.drawQRBox(qr);
        });
        
        // Draw association lines
        this.associations.forEach((assoc) => {
            this.drawAssociationLine(assoc);
        });
    }
    
    drawObjectBox(obj) {
        const scaleX = this.canvas.width / this.video.videoWidth;
        const scaleY = this.canvas.height / this.video.videoHeight;
        
        const x = obj.position.x * scaleX;
        const y = obj.position.y * scaleY;
        const width = obj.position.width * scaleX;
        const height = obj.position.height * scaleY;
        
        // Draw box
        this.ctx.strokeStyle = '#2563eb';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        
        // Draw label
        this.ctx.fillStyle = '#2563eb';
        this.ctx.fillRect(x, y - 20, 80, 20);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`Object ${obj.id}`, x + 5, y - 8);
    }
    
    drawQRBox(qr) {
        const scaleX = this.canvas.width / this.video.videoWidth;
        const scaleY = this.canvas.height / this.video.videoHeight;
        
        const x = qr.position.x * scaleX;
        const y = qr.position.y * scaleY;
        const width = qr.position.width * scaleX;
        const height = qr.position.height * scaleY;
        
        // Draw box
        this.ctx.strokeStyle = '#16a34a';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        
        // Draw label
        const labelText = qr.content.length > 15 ? qr.content.substring(0, 15) + '...' : qr.content;
        const labelWidth = Math.max(120, this.ctx.measureText(labelText).width + 10);
        this.ctx.fillStyle = '#16a34a';
        this.ctx.fillRect(x, y - 20, labelWidth, 20);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(labelText, x + 5, y - 8);
    }
    
    drawAssociationLine(assoc) {
        const obj = this.detectedObjects.get(assoc.object_id);
        const qr = this.detectedQRCodes.get(assoc.qr_code_id);
        
        if (!obj || !qr) return;
        
        const scaleX = this.canvas.width / this.video.videoWidth;
        const scaleY = this.canvas.height / this.video.videoHeight;
        
        const objCenterX = (obj.position.x + obj.position.width / 2) * scaleX;
        const objCenterY = (obj.position.y + obj.position.height / 2) * scaleY;
        const qrCenterX = (qr.position.x + qr.position.width / 2) * scaleX;
        const qrCenterY = (qr.position.y + qr.position.height / 2) * scaleY;
        
        // Draw line
        this.ctx.strokeStyle = '#ea580c';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(objCenterX, objCenterY);
        this.ctx.lineTo(qrCenterX, qrCenterY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    handleVideoClick(e) {
        if (!this.isTracking) return;
        
        const rect = this.video.getBoundingClientRect();
        const scaleX = this.video.videoWidth / rect.width;
        const scaleY = this.video.videoHeight / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        this.createTrackedObject(x, y);
    }
    
    createTrackedObject(x, y) {
        this.objectCounter++;
        const id = `obj_${this.objectCounter}`;
        
        const obj = {
            id: id,
            type: 'manual_selection',
            position: {
                x: Math.max(0, x - 25),
                y: Math.max(0, y - 25),
                width: 50,
                height: 50
            },
            timestamp: new Date().toISOString(),
            confidence: 1.0,
            properties: {
                tracking_method: 'click_selection',
                created_at: new Date().toISOString()
            }
        };
        
        this.detectedObjects.set(id, obj);
        this.updateObjectList();
        this.updateStats();
        this.updateAssociationControls();
        
        this.showSuccess(`Object ${this.objectCounter} added for tracking`);
    }
    
    async startQRScanning() {
        if (!this.currentCamera) {
            this.showError('Camera must be started first');
            return;
        }
        
        try {
            this.qrScanner = new Html5Qrcode("qr-scanner-region");
            
            await this.qrScanner.start(
                this.cameraSelect.value,
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText, decodedResult) => {
                    this.handleQRCodeDetected(decodedText, decodedResult);
                },
                (errorMessage) => {
                    // QR code scanning error (normal when no QR code is present)
                }
            );
            
            this.isQRScanning = true;
            this.updateQRStatus('Scanning', 'success');
            
            document.getElementById('start-qr-scan').disabled = true;
            document.getElementById('stop-qr-scan').disabled = false;
            
            this.showSuccess('QR code scanning started');
        } catch (error) {
            this.showError('Failed to start QR scanning: ' + error.message);
            this.updateQRStatus('Failed', 'error');
        }
    }
    
    async stopQRScanning() {
        if (this.qrScanner && this.isQRScanning) {
            try {
                await this.qrScanner.stop();
                this.qrScanner = null;
                this.isQRScanning = false;
                this.updateQRStatus('Idle', 'info');
                
                document.getElementById('start-qr-scan').disabled = false;
                document.getElementById('stop-qr-scan').disabled = true;
            } catch (error) {
                console.warn('Error stopping QR scanner:', error);
            }
        }
    }
    
    handleQRCodeDetected(decodedText, decodedResult) {
        // Check if this QR code was recently detected (avoid duplicates)
        const existingQR = Array.from(this.detectedQRCodes.values())
            .find(qr => qr.content === decodedText && 
                   Date.now() - new Date(qr.timestamp).getTime() < 2000);
        
        if (existingQR) return;
        
        this.qrCounter++;
        const id = `qr_${this.qrCounter}`;
        
        const qr = {
            id: id,
            content: decodedText,
            position: {
                x: decodedResult.result.location?.topLeftCorner?.x || 0,
                y: decodedResult.result.location?.topLeftCorner?.y || 0,
                width: 100,
                height: 100
            },
            timestamp: new Date().toISOString(),
            format: decodedResult.result.format?.formatName || 'QR_CODE'
        };
        
        this.detectedQRCodes.set(id, qr);
        this.updateQRList();
        this.updateStats();
        this.updateAssociationControls();
        
        this.showSuccess(`QR code detected: ${decodedText.substring(0, 30)}${decodedText.length > 30 ? '...' : ''}`);
    }
    
    updateObjectList() {
        if (this.detectedObjects.size === 0) {
            this.objectList.innerHTML = '<p class="no-data">No objects being tracked</p>';
            return;
        }
        
        const html = Array.from(this.detectedObjects.values()).map(obj => `
            <div class="data-item">
                <div class="data-item-content">
                    <div class="data-item-title">Object ${obj.id.split('_')[1]}</div>
                    <div class="data-item-subtitle">
                        ${obj.type} • ${new Date(obj.timestamp).toLocaleTimeString()}
                    </div>
                </div>
                <div class="data-item-actions">
                    <button onclick="app.removeObject('${obj.id}')">Remove</button>
                </div>
            </div>
        `).join('');
        
        this.objectList.innerHTML = html;
    }
    
    updateQRList() {
        if (this.detectedQRCodes.size === 0) {
            this.qrList.innerHTML = '<p class="no-data">No QR codes detected</p>';
            return;
        }
        
        const html = Array.from(this.detectedQRCodes.values()).map(qr => `
            <div class="data-item">
                <div class="data-item-content">
                    <div class="data-item-title">${qr.content.substring(0, 25)}${qr.content.length > 25 ? '...' : ''}</div>
                    <div class="data-item-subtitle">
                        ${qr.format} • ${new Date(qr.timestamp).toLocaleTimeString()}
                    </div>
                </div>
                <div class="data-item-actions">
                    <button onclick="app.removeQRCode('${qr.id}')">Remove</button>
                </div>
            </div>
        `).join('');
        
        this.qrList.innerHTML = html;
    }
    
    updateAssociationList() {
        if (this.associations.size === 0) {
            this.associationList.innerHTML = '<p class="no-data">No associations created</p>';
            return;
        }
        
        const html = Array.from(this.associations.values()).map(assoc => {
            const obj = this.detectedObjects.get(assoc.object_id);
            const qr = this.detectedQRCodes.get(assoc.qr_code_id);
            const objName = obj ? `Object ${obj.id.split('_')[1]}` : 'Unknown Object';
            const qrName = qr ? qr.content.substring(0, 20) : 'Unknown QR';
            
            return `
                <div class="data-item">
                    <div class="data-item-content">
                        <div class="data-item-title">${objName} ↔ ${qrName}</div>
                        <div class="data-item-subtitle">
                            ${new Date(assoc.timestamp).toLocaleTimeString()}
                            ${assoc.notes ? ` • ${assoc.notes.substring(0, 30)}` : ''}
                        </div>
                    </div>
                    <div class="data-item-actions">
                        <button onclick="app.removeAssociation('${assoc.id}')">Remove</button>
                    </div>
                </div>
            `;
        }).join('');
        
        this.associationList.innerHTML = html;
    }
    
    showAssociationModal() {
        const modal = document.getElementById('association-modal');
        const qrSelect = document.getElementById('association-qr-select');
        const objSelect = document.getElementById('association-object-select');
        
        // Populate QR codes
        qrSelect.innerHTML = '<option value="">Select QR Code</option>';
        this.detectedQRCodes.forEach(qr => {
            const option = document.createElement('option');
            option.value = qr.id;
            option.textContent = qr.content.substring(0, 40) + (qr.content.length > 40 ? '...' : '');
            qrSelect.appendChild(option);
        });
        
        // Populate objects
        objSelect.innerHTML = '<option value="">Select Object</option>';
        this.detectedObjects.forEach(obj => {
            const option = document.createElement('option');
            option.value = obj.id;
            option.textContent = `Object ${obj.id.split('_')[1]} (${obj.type})`;
            objSelect.appendChild(option);
        });
        
        modal.classList.remove('hidden');
    }
    
    hideAssociationModal() {
        const modal = document.getElementById('association-modal');
        modal.classList.add('hidden');
        
        // Clear form
        document.getElementById('association-qr-select').value = '';
        document.getElementById('association-object-select').value = '';
        document.getElementById('association-notes').value = '';
    }
    
    saveAssociation() {
        const qrId = document.getElementById('association-qr-select').value;
        const objId = document.getElementById('association-object-select').value;
        const notes = document.getElementById('association-notes').value;
        
        if (!qrId || !objId) {
            this.showError('Please select both a QR code and an object');
            return;
        }
        
        // Check if association already exists
        const existingAssoc = Array.from(this.associations.values())
            .find(assoc => assoc.qr_code_id === qrId && assoc.object_id === objId);
        
        if (existingAssoc) {
            this.showError('This association already exists');
            return;
        }
        
        this.associationCounter++;
        const id = `assoc_${this.associationCounter}`;
        
        const association = {
            id: id,
            qr_code_id: qrId,
            object_id: objId,
            timestamp: new Date().toISOString(),
            notes: notes.trim(),
            confidence: 1.0
        };
        
        this.associations.set(id, association);
        this.updateAssociationList();
        this.updateStats();
        this.hideAssociationModal();
        
        this.showSuccess('Association created successfully');
    }
    
    removeObject(id) {
        this.detectedObjects.delete(id);
        
        // Remove related associations
        const relatedAssocs = Array.from(this.associations.values())
            .filter(assoc => assoc.object_id === id);
        relatedAssocs.forEach(assoc => this.associations.delete(assoc.id));
        
        this.updateObjectList();
        this.updateAssociationList();
        this.updateStats();
        this.updateAssociationControls();
    }
    
    removeQRCode(id) {
        this.detectedQRCodes.delete(id);
        
        // Remove related associations
        const relatedAssocs = Array.from(this.associations.values())
            .filter(assoc => assoc.qr_code_id === id);
        relatedAssocs.forEach(assoc => this.associations.delete(assoc.id));
        
        this.updateQRList();
        this.updateAssociationList();
        this.updateStats();
        this.updateAssociationControls();
    }
    
    removeAssociation(id) {
        this.associations.delete(id);
        this.updateAssociationList();
        this.updateStats();
    }
    
    updateAssociationControls() {
        const hasObjects = this.detectedObjects.size > 0;
        const hasQRCodes = this.detectedQRCodes.size > 0;
        const canCreateAssociation = hasObjects && hasQRCodes;
        
        document.getElementById('create-association').disabled = !canCreateAssociation;
    }
    
    exportData() {
        const sessionData = {
            session: {
                start_time: this.sessionStart,
                duration: this.getSessionDuration(),
                timestamp: new Date().toISOString()
            },
            objects: Array.from(this.detectedObjects.values()),
            qr_codes: Array.from(this.detectedQRCodes.values()),
            associations: Array.from(this.associations.values()),
            statistics: {
                total_objects: this.detectedObjects.size,
                total_qr_codes: this.detectedQRCodes.size,
                total_associations: this.associations.size,
                session_duration: this.getSessionDuration(),
                average_fps: this.fps
            }
        };
        
        const dataStr = JSON.stringify(sessionData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `object_tracking_session_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        this.showSuccess('Session data exported successfully');
    }
    
    clearSession() {
        if (confirm('Are you sure you want to clear all session data?')) {
            this.detectedObjects.clear();
            this.detectedQRCodes.clear();
            this.associations.clear();
            
            this.objectCounter = 0;
            this.qrCounter = 0;
            this.associationCounter = 0;
            
            this.updateObjectList();
            this.updateQRList();
            this.updateAssociationList();
            this.updateStats();
            this.updateAssociationControls();
            
            this.sessionStart = new Date();
            this.showSuccess('Session data cleared');
        }
    }
    
    startSessionTimer() {
        this.sessionStart = new Date();
        setInterval(() => {
            this.updateSessionDuration();
        }, 1000);
    }
    
    updateSessionDuration() {
        const duration = this.getSessionDuration();
        this.sessionDuration.textContent = `Session: ${duration}`;
    }
    
    getSessionDuration() {
        if (!this.sessionStart) return '00:00:00';
        
        const now = new Date();
        const diff = now - this.sessionStart;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    updateStats() {
        this.objectsCount.textContent = `Objects: ${this.detectedObjects.size}`;
        this.qrCount.textContent = `QR Codes: ${this.detectedQRCodes.size}`;
        this.associationsCount.textContent = `Associations: ${this.associations.size}`;
    }
    
    updateCameraStatus(text, type) {
        this.cameraStatus.textContent = `Camera: ${text}`;
        this.cameraStatus.className = `status status--${type}`;
    }
    
    updateQRStatus(text, type) {
        this.qrStatus.textContent = `QR Scanner: ${text}`;
        this.qrStatus.className = `status status--${type}`;
    }
    
    updateTrackingStatus(text, type) {
        this.trackingStatus.textContent = `Tracking: ${text}`;
        this.trackingStatus.className = `status status--${type}`;
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showError(message) {
        this.showNotification(message, 'error');
        console.error(message);
    }
    
    showNotification(message, type) {
        // Simple notification system - could be enhanced with a proper toast library
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transition: opacity 0.3s ease;
        `;
        
        if (type === 'success') {
            notification.style.backgroundColor = '#16a34a';
        } else if (type === 'error') {
            notification.style.backgroundColor = '#dc2626';
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 4000);
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ObjectTracker();
});

// Make app available globally for button callbacks
window.app = app;