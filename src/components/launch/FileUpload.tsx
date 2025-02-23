"use client";
import React, { useState, ChangeEvent, DragEvent } from "react";
import Image from "next/image";

export interface FileUploadProps {
  setImage: (image: File) => void;
  setImageURL: (url: string | undefined) => void;
  url?: string;
  label?: string;
  description?: string;
}

export function FileUpload({
  setImage,
  setImageURL,
  url,
  label,
  description,
}: FileUploadProps) {
  const [dragging, setDragging] = useState<boolean>(false);
  //const [imagePreview, setImagePreview] = useState<string>(url || "/token.png");

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      //setImagePreview(url);
      setImage(file);
      setImageURL(url);
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setImageURL(URL.createObjectURL(file)); // Set the image preview
    }
  };

  return (
    <>
      <div
        className="shrink-0"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <figure className="relative inline-block w-300 h-300 ">
          <Image
            src={url ?? "/img/minanft.png"}
            alt="image"
            height={300}
            width={300}
            className="rounded-xl border-[5px] border-white dark:border-jacarta-600 object-cover !w-[150px] !h-[150px] overflow-hidden "
          />
          <div className="group absolute -right-3 -bottom-2 h-8 w-8 overflow-hidden rounded-full border border-jacarta-100 bg-white text-center hover:border-transparent hover:bg-accent">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="absolute top-0 left-0 w-full cursor-pointer opacity-0"
            />
            <div className="flex h-full items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                className="h-4 w-4 fill-jacarta-400 group-hover:fill-white"
              >
                <path fill="none" d="M0 0h24v24H0z" />
                <path d="M15.728 9.686l-1.414-1.414L5 17.586V19h1.414l9.314-9.314zm1.414-1.414l1.414-1.414-1.414-1.414-1.414 1.414 1.414 1.414zM7.242 21H3v-4.243L16.435 3.322a1 1 0 0 1 1.414 0l2.829 2.829a1 1 0 0 1 0 1.414L7.243 21z" />
              </svg>
            </div>
          </div>
          <input
            type="file"
            accept="image/*,video/*,audio/*,webgl/*,.glb,.gltf"
            id="file-upload"
            onChange={handleImageChange}
            className="absolute inset-0 z-20 cursor-pointer opacity-0"
          />
        </figure>
      </div>
      <div className="mt-4">
        <span className="mb-3 block font-display text-sm text-jacarta-700 dark:text-white">
          {label ?? "NFT collection image"}
        </span>
        <p className="text-sm leading-normal dark:text-jacarta-300">
          {description ??
            "Upload an image or GIF (maximum size 5MB). You can drag and drop a file here or click to browse."}
        </p>
      </div>
    </>
  );
}

/* 
    <div className="rounded-xl border-[5px] border-white dark:border-jacarta-600 object-cover !w-[150px] !h-[150px] overflow-hidden ">
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="group relative flex max-w-md flex-col items-center justify-center rounded-lg  bg-white py-20 px-5 text-center dark:border-jacarta-600 dark:bg-jacarta-700"
      >
        {imagePreview ? (
          <Image
            src={imagePreview}
            alt="Preview"
            layout="fill"
            objectFit="contain"
            className="absolute inset-0 z-10 rounded-lg"
          />
        ) : (
          <div className="group absolute -right-3 -bottom-2 h-8 w-8 overflow-hidden rounded-full border border-jacarta-100 bg-white text-center hover:border-transparent hover:bg-accent">
            <div className="flex h-full items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                className="h-4 w-4 fill-jacarta-400 group-hover:fill-white"
              >
                <path fill="none" d="M0 0h24v24H0z" />
                <path d="M15.728 9.686l-1.414-1.414L5 17.586V19h1.414l9.314-9.314zm1.414-1.414l1.414-1.414-1.414-1.414-1.414 1.414 1.414 1.414zM7.242 21H3v-4.243L16.435 3.322a1 1 0 0 1 1.414 0l2.829 2.829a1 1 0 0 1 0 1.414L7.243 21z" />
              </svg>
            </div>
          </div>
        )}

        <input
          type="file"
          accept="image/*,video/*,audio/*,webgl/*,.glb,.gltf"
          id="file-upload"
          onChange={handleImageChange}
          className="absolute inset-0 z-20 cursor-pointer opacity-0"
        />
      </div>
    </div>
    );
    */
