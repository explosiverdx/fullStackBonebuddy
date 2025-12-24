import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';

const ImageCropper = ({ image, onCropComplete, onCancel, onUseFullPhoto, aspectRatio = null }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lockAspectRatio, setLockAspectRatio] = useState(false);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(null);
  const [cropInitialized, setCropInitialized] = useState(false);

  const onCropChange = useCallback((crop) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteCallback = useCallback((croppedArea, croppedAreaPixels) => {
    if (croppedAreaPixels) {
      setCroppedAreaPixels(croppedAreaPixels);
      if (!cropInitialized) {
        setCropInitialized(true);
      }
    }
  }, [cropInitialized]);

  const handleDone = async () => {
    // Wait for crop area to be initialized
    if (!croppedAreaPixels) {
      alert('Please wait for the crop area to initialize, or move the image slightly');
      return;
    }
    
    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Failed to crop image: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const aspectRatioOptions = [
    { label: 'Free', value: null },
    { label: '16:9', value: 16 / 9 },
    { label: '4:3', value: 4 / 3 },
    { label: '1:1', value: 1 },
    { label: '3:4', value: 3 / 4 },
    { label: '9:16', value: 9 / 16 },
  ];

  const currentAspectRatio = lockAspectRatio ? selectedAspectRatio : aspectRatio;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black text-white">
        <button
          onClick={onCancel}
          className="text-white hover:text-gray-300 text-lg font-semibold"
        >
          Cancel
        </button>
        <h2 className="text-lg font-semibold">Adjust Photo</h2>
        <div className="flex gap-3">
          <button
            onClick={onUseFullPhoto}
            className="text-blue-400 hover:text-blue-300 text-lg font-semibold"
          >
            Use Full Photo
          </button>
          <button
            onClick={handleDone}
            disabled={isProcessing}
            className="text-teal-400 hover:text-teal-300 text-lg font-semibold disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Done'}
          </button>
        </div>
      </div>

      {/* Cropper Container */}
      <div className="flex-1 relative">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={currentAspectRatio || undefined}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropCompleteCallback}
          cropShape="rect"
          showGrid={true}
          restrictPosition={false}
          style={{
            containerStyle: {
              width: '100%',
              height: '100%',
              position: 'relative',
            },
          }}
        />
      </div>

      {/* Controls */}
      <div className="bg-black p-4 text-white">
        <div className="max-w-md mx-auto space-y-4">
          {/* Aspect Ratio Options */}
          <div>
            <label className="block text-sm font-medium mb-2">Aspect Ratio</label>
            <div className="flex flex-wrap gap-2">
              {aspectRatioOptions.map((option) => (
                <button
                  key={option.label}
                  onClick={() => {
                    if (option.value === null) {
                      // Free crop mode
                      setLockAspectRatio(false);
                      setSelectedAspectRatio(null);
                    } else {
                      // Locked aspect ratio
                      setSelectedAspectRatio(option.value);
                      setLockAspectRatio(true);
                    }
                  }}
                  className={`px-3 py-1 text-xs rounded border ${
                    (option.value === null && !lockAspectRatio) ||
                    (lockAspectRatio && selectedAspectRatio === option.value)
                      ? 'bg-teal-600 border-teal-400 text-white'
                      : 'border-gray-600 hover:bg-gray-800'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Zoom Control */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Zoom: {Math.round(zoom * 100)}%
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Instructions */}
          <div className="text-center text-xs text-gray-400">
            {currentAspectRatio 
              ? 'Drag image to reposition • Use zoom slider to adjust' 
              : 'Free crop - Drag image to reposition • Use zoom slider to adjust size • Crop area adjusts automatically'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;

