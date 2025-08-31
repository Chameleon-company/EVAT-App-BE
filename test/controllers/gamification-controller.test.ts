import { Request, Response } from "express";
import mongoose from "mongoose";
import GamificationController from "../../src/controllers/gamification-controller";
import { GameVirtualItem, GameProfile, GameEvent } from "../../src/models/game-model";

// Mock the Mongoose models
jest.mock("../../src/models/game-model", () => ({
  GameVirtualItem: {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    findOne: jest.fn(),
  },
  GameProfile: {
    findOne: jest.fn(),
  },
  GameEvent: {
    create: jest.fn(),
  },
}));

describe("GamificationController", () => {
  let gamificationController: GamificationController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Reset all mocks and create fresh instances before each test
    jest.clearAllMocks();
    gamificationController = new GamificationController();

    // Setup mock response with Jest spies
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  // --- Virtual Item CRUD Tests ---

  describe("createVirtualItem", () => {
    test("Case: Should create a virtual item successfully", async () => {
      // Arrange
      const itemData = {
        item_id_string: "TEST_ITEM_01",
        name: "Test Item",
        item_type: "CAR_STICKER",
        value_points: 100,
      };
      mockRequest = { body: itemData };

      (GameVirtualItem.findOne as jest.Mock).mockResolvedValue(null);
      (GameVirtualItem.create as jest.Mock).mockResolvedValue(itemData);

      // Act
      await gamificationController.createVirtualItem(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(GameVirtualItem.create).toHaveBeenCalledWith(itemData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Virtual item created successfully",
          data: itemData,
        })
      );
    });

     test("Case: Should return 409 if item_id_string already exists", async () => {
      // Arrange
       const itemData = { item_id_string: "EXISTING_ITEM", name: "Existing Item", item_type: "CAR_PAINT", value_points: 50 };
       mockRequest = { body: itemData };

      (GameVirtualItem.findOne as jest.Mock).mockResolvedValue(itemData);

      // Act
      await gamificationController.createVirtualItem(mockRequest as Request, mockResponse as Response);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: `An item with item_id_string 'EXISTING_ITEM' already exists.`});
    });
  });

  describe("getAllVirtualItems", () => {
    test("Case: Should retrieve all virtual items", async () => {
      // Arrange
      const mockItems = [{ name: "Item 1" }, { name: "Item 2" }];
      mockRequest = {};
      (GameVirtualItem.find as jest.Mock).mockResolvedValue(mockItems);

      // Act
      await gamificationController.getAllVirtualItems(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(GameVirtualItem.find).toHaveBeenCalledWith({});
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "All virtual items retrieved successfully",
        data: mockItems,
      });
    });
  });

  describe("getVirtualItemById", () => {
    test("Case: Should retrieve a single virtual item by ID", async () => {
      // Arrange
      const itemId = new mongoose.Types.ObjectId().toHexString();
      const mockItem = { _id: itemId, name: "Specific Item" };
      mockRequest = { params: { itemId } };

      (GameVirtualItem.findById as jest.Mock).mockResolvedValue(mockItem);

      // Act
      await gamificationController.getVirtualItemById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(GameVirtualItem.findById).toHaveBeenCalledWith(itemId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Virtual item retrieved successfully",
        data: mockItem,
      });
    });

    test("Case: Should return 404 if item not found", async () => {
       // Arrange
       const itemId = new mongoose.Types.ObjectId().toHexString();
       mockRequest = { params: { itemId } };
       (GameVirtualItem.findById as jest.Mock).mockResolvedValue(null);

       // Act
       await gamificationController.getVirtualItemById(mockRequest as Request, mockResponse as Response);

       // Assert
       expect(mockResponse.status).toHaveBeenCalledWith(404);
       expect(mockResponse.json).toHaveBeenCalledWith({ message: "Virtual item not found." });
    });
  });

  describe("updateVirtualItem", () => {
    test("Case: Should update a virtual item successfully", async () => {
      // Arrange
      const itemId = new mongoose.Types.ObjectId().toHexString();
      const updateData = { name: "Updated Item Name" };
      const updatedItem = { _id: itemId, ...updateData };
      mockRequest = { params: { itemId }, body: updateData };

      (GameVirtualItem.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedItem);

      // Act
      await gamificationController.updateVirtualItem(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(GameVirtualItem.findByIdAndUpdate).toHaveBeenCalledWith(itemId, updateData, { new: true });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Virtual item updated successfully",
        data: updatedItem,
      });
    });
  });

  describe("deleteVirtualItem", () => {
    test("Case: Should delete a virtual item successfully", async () => {
      // Arrange
      const itemId = new mongoose.Types.ObjectId().toHexString();
      mockRequest = { params: { itemId } };

      (GameVirtualItem.findByIdAndDelete as jest.Mock).mockResolvedValue({ _id: itemId });

      // Act
      await gamificationController.deleteVirtualItem(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(GameVirtualItem.findByIdAndDelete).toHaveBeenCalledWith(itemId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Virtual item deleted successfully",
      });
    });
  });
});

