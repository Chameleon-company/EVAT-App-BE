import { Request, Response } from "express";
import GamificationController from "../../src/controllers/gamification-controller";
import { GameVirtualItem } from "../../src/models/game-model";

// Mock the Mongoose model for GameVirtualItem
jest.mock("../../src/models/game-model", () => ({
    GameVirtualItem: {
        create: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn(),
        findById: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        findByIdAndDelete: jest.fn(),
    },
    // We also need to mock the other models exported from this file to prevent errors
    GameProfile: jest.fn(),
    GameEvent: jest.fn(),
    GameQuest: jest.fn(),
    GameBadge: jest.fn(),
}));

describe("GamificationController (Admin Virtual Items)", () => {
    let gamificationController: GamificationController;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        gamificationController = new GamificationController();

        // Setup mock response with jest functions for chaining
        jsonMock = jest.fn().mockReturnThis();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        mockResponse = {
            status: statusMock,
            json: jsonMock,
        };

        // Default mock request
        mockRequest = {
            body: {},
            params: {},
        };
    });

    describe("createVirtualItem", () => {
        const itemData = {
            item_id_string: "TEST_ITEM_01",
            name: "Test Item",
            item_type: "CAR_ACCESSORY",
            value_points: 100,
        };

        test("Case: Should create a new virtual item successfully", async () => {
            // Arrange
            mockRequest.body = itemData;
            (GameVirtualItem.findOne as jest.Mock).mockResolvedValue(null);
            (GameVirtualItem.create as jest.Mock).mockResolvedValue({ _id: "new_item_id", ...itemData });

            // Act
            await gamificationController.createVirtualItem(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(GameVirtualItem.create).toHaveBeenCalledWith(itemData);
            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                message: "Virtual item created successfully",
            }));
        });

        test("Case: Should return 409 if item_id_string already exists", async () => {
            // Arrange
            mockRequest.body = itemData;
            (GameVirtualItem.findOne as jest.Mock).mockResolvedValue(itemData);

            // Act
            await gamificationController.createVirtualItem(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(GameVirtualItem.findOne).toHaveBeenCalledWith({ item_id_string: itemData.item_id_string });
            expect(statusMock).toHaveBeenCalledWith(409);
            expect(jsonMock).toHaveBeenCalledWith({ message: expect.stringContaining("already exists") });
        });
    });

    describe("updateVirtualItem", () => {
        test("Case: Should update an item successfully", async () => {
            // Arrange
            const itemId = "existing_item_id";
            const updateData = { name: "Updated Test Item" };
            mockRequest.params = { itemId };
            mockRequest.body = updateData;
            (GameVirtualItem.findByIdAndUpdate as jest.Mock).mockResolvedValue({ _id: itemId, ...updateData });

            // Act
            await gamificationController.updateVirtualItem(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(GameVirtualItem.findByIdAndUpdate).toHaveBeenCalledWith(itemId, updateData, { new: true });
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                message: "Virtual item updated successfully",
            }));
        });
        
        test("Case: Should return 404 if item to update is not found", async () => {
            // Arrange
            mockRequest.params = { itemId: "not_found_id" };
            mockRequest.body = { name: "Does not matter" };
            (GameVirtualItem.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

            // Act
            await gamificationController.updateVirtualItem(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ message: "Virtual item not found." });
        });
    });

    describe("deleteVirtualItem", () => {
        test("Case: Should delete an item successfully", async () => {
            // Arrange
            const itemId = "existing_item_id";
            mockRequest.params = { itemId };
            (GameVirtualItem.findByIdAndDelete as jest.Mock).mockResolvedValue({ _id: itemId });

            // Act
            await gamificationController.deleteVirtualItem(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(GameVirtualItem.findByIdAndDelete).toHaveBeenCalledWith(itemId);
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({ message: "Virtual item deleted successfully" });
        });

        test("Case: Should return 404 if item to delete is not found", async () => {
            // Arrange
            mockRequest.params = { itemId: "not_found_id" };
            (GameVirtualItem.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

            // Act
            await gamificationController.deleteVirtualItem(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ message: "Virtual item not found." });
        });
    });
});
